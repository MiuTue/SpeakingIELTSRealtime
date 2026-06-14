import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRouteError, jsonError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";
import { createGeminiLiveToken } from "@/lib/mobile/geminiTokens";
import { buildGeminiLiveSetup } from "@/lib/realtime/sessionConfig";
import type { RealtimeVoice } from "@/lib/realtime/voices";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request.headers);
    const { id } = await context.params;
    const session = await prisma.speakingSession.findFirst({
      where: {
        id,
        userId: user.id,
        status: { in: ["ACTIVE", "PAUSED"] }
      }
    });
    if (!session) return jsonError("Active session not found", 404);

    const token = await createGeminiLiveToken();
    const part =
      session.mode === "PART2"
        ? "PART2"
        : session.mode === "PART3"
          ? "PART3"
          : "PART1";
    const setup = buildGeminiLiveSetup({
      mode: session.mode,
      part,
      topic: session.topic,
      targetBand: session.targetBand,
      voice: session.voice as RealtimeVoice
    });
    const checkpoint =
      session.checkpointJson && typeof session.checkpointJson === "object"
        ? (session.checkpointJson as { question?: unknown; examinerTurnComplete?: unknown })
        : null;
    const resumedQuestion =
      typeof checkpoint?.question === "string" ? checkpoint.question.trim() : "";
    if (resumedQuestion && checkpoint?.examinerTurnComplete === true) {
      setup.setup.systemInstruction.parts[0].text +=
        `\n\nThe session is resuming after an interruption. You already asked this exact question: "${resumedQuestion}". Do not repeat it. Wait silently for the candidate's answer, then continue the exam naturally.`;
    }

    return NextResponse.json({ ...token, setup }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
