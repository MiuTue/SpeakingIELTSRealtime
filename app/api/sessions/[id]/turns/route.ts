import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, handleRouteError } from "@/lib/api/http";
import { createTurnSchema } from "@/lib/api/schemas";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request.headers);
    const { id } = await context.params;
    const input = createTurnSchema.parse(await request.json());
    const session = await prisma.speakingSession.findFirst({
      where: { id, userId: user.id }
    });

    if (!session) {
      return jsonError("Session not found", 404);
    }

    const turn = await prisma.speakingTurn.create({
      data: {
        ...input,
        sessionId: id,
        feedbackJson:
          input.feedbackJson === undefined
            ? undefined
            : JSON.parse(JSON.stringify(input.feedbackJson))
      }
    });

    return NextResponse.json({ turn }, { status: 201 });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
