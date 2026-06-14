import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { updateMobileSessionSchema } from "@speakielts/contracts";
import { prisma } from "@/lib/db";
import { handleRouteError, jsonError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";
import { toJsonValue, toMobileSessionSummary } from "@/lib/mobile/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request.headers);
    const { id } = await context.params;
    const session = await prisma.speakingSession.findFirst({
      where: { id, userId: user.id },
      include: {
        turns: { orderBy: [{ sequence: "asc" }, { createdAt: "asc" }] },
        evaluationJobs: {
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 1
        }
      }
    });
    if (!session) return jsonError("Session not found", 404);

    return NextResponse.json({
      session: {
        ...toMobileSessionSummary(session),
        voice: session.voice,
        checkpoint: session.checkpointJson,
        turns: session.turns,
        feedback: session.evaluationJobs[0]?.feedbackJson ?? null
      }
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request.headers);
    const { id } = await context.params;
    const input = updateMobileSessionSchema.parse(await request.json());
    const existing = await prisma.speakingSession.findFirst({
      where: { id, userId: user.id }
    });
    if (!existing) return jsonError("Session not found", 404);
    if (existing.version !== input.version) {
      return jsonError("Session changed on another client", 409);
    }

    const now = new Date();
    const session = await prisma.speakingSession.update({
      where: { id },
      data: {
        status: input.status,
        checkpointJson:
          input.checkpoint === undefined
            ? undefined
            : input.checkpoint === null
              ? Prisma.DbNull
              : toJsonValue(input.checkpoint),
        durationSeconds: input.durationSeconds,
        finalBand: input.finalBand,
        pausedAt: input.status === "PAUSED" ? now : undefined,
        resumedAt: input.status === "ACTIVE" ? now : undefined,
        endedAt:
          input.status === "COMPLETED" || input.status === "CANCELLED"
            ? now
            : undefined,
        version: { increment: 1 }
      }
    });

    return NextResponse.json({ session: toMobileSessionSummary(session) });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request.headers);
    const { id } = await context.params;
    const session = await prisma.speakingSession.findFirst({
      where: { id, userId: user.id }
    });
    if (!session) return jsonError("Session not found", 404);

    await prisma.$transaction([
      prisma.speakingTurn.deleteMany({ where: { sessionId: id } }),
      prisma.speakingSession.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
