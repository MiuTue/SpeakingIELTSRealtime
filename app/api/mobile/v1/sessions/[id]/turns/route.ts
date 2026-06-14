import { NextResponse } from "next/server";
import { createMobileTurnSchema } from "@speakielts/contracts";
import { prisma } from "@/lib/db";
import { handleRouteError, jsonError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request.headers);
    const { id } = await context.params;
    const input = createMobileTurnSchema.parse(await request.json());
    const session = await prisma.speakingSession.findFirst({
      where: { id, userId: user.id },
      select: { id: true }
    });
    if (!session) return jsonError("Session not found", 404);

    const turn = await prisma.speakingTurn.upsert({
      where: {
        sessionId_clientTurnId: {
          sessionId: id,
          clientTurnId: input.clientTurnId
        }
      },
      create: {
        sessionId: id,
        clientTurnId: input.clientTurnId,
        sequence: input.sequence,
        part: input.part,
        question: input.question,
        transcript: input.transcript,
        durationSeconds: input.durationSeconds,
        syncStatus: "SYNCED"
      },
      update: {
        sequence: input.sequence,
        part: input.part,
        question: input.question,
        transcript: input.transcript,
        durationSeconds: input.durationSeconds,
        syncStatus: "SYNCED"
      }
    });

    return NextResponse.json({ turn }, { status: 201 });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
