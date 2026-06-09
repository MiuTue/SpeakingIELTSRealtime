import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/api/http";
import { handleAuthError, requireAdmin } from "@/lib/server/authGuards";

export async function GET(request: Request) {
  try {
    await requireAdmin(request.headers);
    const [totalUsers, totalSessions, activeSessions, scoredSessions] = await Promise.all([
      prisma.user.count(),
      prisma.speakingSession.count(),
      prisma.speakingSession.count({ where: { status: "ACTIVE" } }),
      prisma.speakingSession.findMany({
        where: { finalBand: { not: null } },
        select: { finalBand: true }
      })
    ]);
    const avgBand =
      scoredSessions.reduce((sum, session) => sum + (session.finalBand ?? 0), 0) /
      Math.max(scoredSessions.length, 1);

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalSessions,
        activeSessions,
        avgBand: Number(avgBand.toFixed(1))
      }
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
