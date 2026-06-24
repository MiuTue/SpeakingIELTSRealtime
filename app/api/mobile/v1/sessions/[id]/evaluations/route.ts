import { NextResponse, after } from "next/server";
import { createEvaluationSchema } from "@speakielts/contracts";
import { prisma } from "@/lib/db";
import { handleRouteError, jsonError } from "@/lib/api/http";
import { evaluateAnswer } from "@/lib/scoring/evaluator";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";
import { toJsonValue } from "@/lib/mobile/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request.headers);
    const { id: sessionId } = await context.params;
    const input = createEvaluationSchema.parse(await request.json());
    const session = await prisma.speakingSession.findFirst({
      where: { id: sessionId, userId: user.id },
      include: { turns: true }
    });
    if (!session) return jsonError("Session not found", 404);

    const existing = await prisma.evaluationJob.findUnique({
      where: {
        sessionId_idempotencyKey: {
          sessionId,
          idempotencyKey: input.idempotencyKey
        }
      }
    });
    if (existing?.status === "COMPLETED") {
      return NextResponse.json({ job: existing });
    }
    if (existing?.status === "PROCESSING") {
      return NextResponse.json({ job: existing }, { status: 202 });
    }

    const job = existing
      ? await prisma.evaluationJob.update({
          where: { id: existing.id },
          data: {
            status: "PROCESSING",
            attemptCount: { increment: 1 },
            startedAt: new Date(),
            errorCode: null,
            errorMessage: null
          }
        })
      : await prisma.evaluationJob.create({
          data: {
            sessionId,
            idempotencyKey: input.idempotencyKey,
            status: "PROCESSING",
            attemptCount: 1,
            startedAt: new Date()
          }
        });

    await prisma.speakingSession.update({
      where: { id: sessionId },
      data: { status: "SCORING" }
    });

    after(async () => {
      try {
        const dialogue = input.turns
          .map(
            (turn) =>
              `${turn.part}\nExaminer: ${turn.question}\nCandidate: ${turn.transcript}`
          )
          .join("\n\n");
        const feedback = await evaluateAnswer({
          question:
            session.mode === "FULL_TEST"
              ? "Full IELTS Speaking Test"
              : "Practice speaking session",
          transcript: dialogue,
          turns: input.turns.map((turn) => ({
            part: turn.part,
            question: turn.question,
            transcript: turn.transcript,
            audio: turn.audio
          })),
          mode: session.mode,
          part: input.turns.at(-1)?.part ?? "PART1",
          topic: session.topic,
          targetBand: session.targetBand
        });
        const completedAt = new Date();
        await prisma.$transaction(async (tx) => {
          await tx.evaluationJob.update({
            where: { id: job.id },
            data: {
              status: "COMPLETED",
              feedbackJson: toJsonValue(feedback),
              completedAt
            }
          });
          await tx.speakingSession.update({
            where: { id: sessionId },
            data: {
              status: "COMPLETED",
              finalBand: feedback.estimated_band,
              endedAt: completedAt,
              version: { increment: 1 }
            }
          });
        });
      } catch (error) {
        console.error("Async evaluation failed for session:", sessionId, error);
        const message =
          error instanceof Error ? error.message.slice(0, 500) : "Scoring failed";
        try {
          await prisma.$transaction([
            prisma.evaluationJob.update({
              where: { id: job.id },
              data: {
                status: "FAILED",
                errorCode: "SCORING_FAILED",
                errorMessage: message,
                completedAt: new Date()
              }
            }),
            prisma.speakingSession.update({
              where: { id: sessionId },
              data: { status: "PAUSED" }
            })
          ]);
        } catch (dbError) {
          console.error("Failed to update evaluation status to FAILED in database:", dbError);
        }
      }
    });

    return NextResponse.json({ job }, { status: 202 });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
