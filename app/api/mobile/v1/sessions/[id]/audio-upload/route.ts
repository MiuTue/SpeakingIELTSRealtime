import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { audioUploadRequestSchema } from "@speakielts/contracts";
import { prisma } from "@/lib/db";
import { handleRouteError, jsonError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";
import { createAudioUploadSlot } from "@/lib/mobile/audioStorage";

type RouteContext = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request.headers);
    const { id: sessionId } = await context.params;
    const input = audioUploadRequestSchema.parse(await request.json());
    const session = await prisma.speakingSession.findFirst({
      where: { id: sessionId, userId: user.id },
      select: { id: true }
    });
    if (!session) return jsonError("Session not found", 404);

    const turn = input.clientTurnId
      ? await prisma.speakingTurn.findFirst({
          where: {
            sessionId,
            clientTurnId: input.clientTurnId
          },
          select: { id: true }
        })
      : null;
    if (input.clientTurnId && !turn) return jsonError("Turn not found", 404);

    const assetId = randomUUID();
    const uploadSlot = createAudioUploadSlot({
      userId: user.id,
      sessionId,
      assetId,
      baseUrl: request.url
    });
    const asset = await prisma.audioAsset.create({
      data: {
        id: assetId,
        sessionId,
        turnId: turn?.id,
        storagePath: uploadSlot.storagePath,
        contentType: input.contentType,
        byteCount: input.byteCount,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    return NextResponse.json(
      {
        asset: {
          id: asset.id,
          storagePath: asset.storagePath,
          expiresAt: asset.expiresAt.toISOString()
        },
        upload: {
          url: uploadSlot.uploadUrl,
          method: "PUT",
          headers: { "Content-Type": input.contentType },
          expiresAt: uploadSlot.expiresAt
        }
      },
      { status: 201 }
    );
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
