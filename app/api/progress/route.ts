import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request.headers);
    const sessions = await prisma.speakingSession.findMany({
      where: { userId: user.id },
      include: { turns: true },
      orderBy: { startedAt: "asc" }
    });

    const scoredSessions = sessions.filter((session) => session.finalBand !== null);
    const avgBand =
      scoredSessions.reduce((sum, session) => sum + (session.finalBand ?? 0), 0) /
      Math.max(scoredSessions.length, 1);
    const minutes =
      sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60;

    return NextResponse.json({
      metrics: {
        avgBand: Number(avgBand.toFixed(1)),
        totalSessions: sessions.length,
        totalSpeakingMinutes: Number(minutes.toFixed(1)),
        recentSessions: sessions.slice(-8)
      }
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
