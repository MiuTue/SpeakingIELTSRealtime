import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, handleRouteError } from "@/lib/api/http";
import {
  verifyAudioUploadToken,
  writeAudioAssetFile
} from "@/lib/mobile/audioStorage";

type RouteContext = { params: Promise<{ assetId: string }> };

export const runtime = "nodejs";

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { assetId } = await context.params;
    const url = new URL(request.url);
    const tokenIsValid = verifyAudioUploadToken({
      assetId,
      expires: url.searchParams.get("expires"),
      token: url.searchParams.get("token")
    });
    if (!tokenIsValid) return jsonError("Invalid or expired upload URL", 403);

    const asset = await prisma.audioAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        storagePath: true,
        contentType: true,
        status: true
      }
    });
    if (!asset) return jsonError("Audio asset not found", 404);
    if (asset.status === "EXPIRED") return jsonError("Audio upload expired", 410);

    const contentType = request.headers.get("content-type")?.split(";")[0];
    if (contentType !== asset.contentType) {
      return jsonError("Audio content type does not match upload slot", 415);
    }

    const bytes = await request.arrayBuffer();
    await prisma.audioAsset.update({
      where: { id: assetId },
      data: { status: "UPLOADING" }
    });
    await writeAudioAssetFile({
      storagePath: asset.storagePath,
      bytes
    });
    const updated = await prisma.audioAsset.update({
      where: { id: assetId },
      data: {
        byteCount: bytes.byteLength,
        status: "COMPLETED"
      }
    });

    return NextResponse.json({
      asset: {
        id: updated.id,
        byteCount: updated.byteCount,
        status: updated.status
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
