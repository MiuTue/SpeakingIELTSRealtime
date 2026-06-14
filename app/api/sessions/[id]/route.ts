import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, handleRouteError } from "@/lib/api/http";
import { updateSessionSchema } from "@/lib/api/schemas";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request.headers);
    const { id } = await context.params;
    const input = updateSessionSchema.parse(await request.json());
    const existing = await prisma.speakingSession.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return jsonError("Session not found", 404);
    }

    const session = await prisma.speakingSession.update({
      where: { id },
      data: {
        ...input,
        endedAt: input.status === "COMPLETED" ? new Date() : undefined
      }
    });

    return NextResponse.json({ session });
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

    if (!session) {
      return jsonError("Session not found", 404);
    }

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
