import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionSchema } from "@/lib/api/schemas";
import { handleRouteError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request.headers);
    const sessions = await prisma.speakingSession.findMany({
      where: { userId: user.id },
      include: { turns: { orderBy: { createdAt: "asc" } } },
      orderBy: { startedAt: "desc" },
      take: 30
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request.headers);
    const input = createSessionSchema.parse(await request.json());
    const session = await prisma.speakingSession.create({
      data: { ...input, userId: user.id }
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
