import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";
import { toMobileSessionSummary } from "@/lib/mobile/session";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request.headers);
    const [sessions, resumableSession, scoringSession, latestCompletedSession] = await Promise.all([
      prisma.speakingSession.findMany({
        where: { userId: user.id },
        select: {
          finalBand: true,
          durationSeconds: true
        }
      }),
      prisma.speakingSession.findFirst({
        where: {
          userId: user.id,
          status: { in: ["ACTIVE", "PAUSED"] }
        },
        orderBy: { startedAt: "desc" }
      }),
      prisma.speakingSession.findFirst({
        where: {
          userId: user.id,
          status: "SCORING"
        },
        orderBy: { startedAt: "desc" }
      }),
      prisma.speakingSession.findFirst({
        where: {
          userId: user.id,
          status: "COMPLETED",
          finalBand: { not: null }
        },
        orderBy: { endedAt: "desc" },
        include: {
          evaluationJobs: {
            where: { status: "COMPLETED" },
            orderBy: { completedAt: "desc" },
            take: 1
          }
        }
      })
    ]);

    const scored = sessions.filter((session) => session.finalBand !== null);
    const avgBand =
      scored.reduce((sum, session) => sum + (session.finalBand ?? 0), 0) /
      Math.max(scored.length, 1);
    const totalSpeakingMinutes =
      sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60;

    const latestFeedback = latestCompletedSession?.evaluationJobs[0]?.feedbackJson as any;
    const subSkills = latestFeedback
      ? {
          fluency: latestFeedback.fluency_coherence?.band ?? 0,
          lexical: latestFeedback.lexical_resource?.band ?? 0,
          grammar: latestFeedback.grammar_range_accuracy?.band ?? 0,
          pronunciation: latestFeedback.pronunciation?.band ?? 0
        }
      : null;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        targetBand: user.targetBand
      },
      metrics: {
        avgBand: Number(avgBand.toFixed(1)),
        totalSessions: sessions.length,
        totalSpeakingMinutes: Number(totalSpeakingMinutes.toFixed(1)),
        subSkills
      },
      resumableSession: resumableSession
        ? toMobileSessionSummary(resumableSession)
        : null,
      scoringSession: scoringSession
        ? toMobileSessionSummary(scoringSession)
        : null,
      appConfig: {
        minimumVersion: process.env.MOBILE_MINIMUM_VERSION ?? "1.0.0",
        latestVersion: process.env.MOBILE_LATEST_VERSION ?? "1.0.0",
        forceUpdate: process.env.MOBILE_FORCE_UPDATE === "true",
        maintenance: process.env.MOBILE_MAINTENANCE === "true",
        audioRetentionHours: 24
      }
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
