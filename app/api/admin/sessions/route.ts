import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/api/http";
import { handleAuthError, requireAdmin } from "@/lib/server/authGuards";

export async function GET(request: Request) {
  try {
    await requireAdmin(request.headers);
    const sessions = await prisma.speakingSession.findMany({
      include: {
        user: { select: { name: true, email: true } },
        turns: { orderBy: { createdAt: "asc" } }
      },
      orderBy: { startedAt: "desc" },
      take: 100
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
