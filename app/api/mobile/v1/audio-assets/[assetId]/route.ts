import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRouteError, jsonError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

const confirmUploadSchema = z.object({
  byteCount: z.number().int().positive().max(25 * 1024 * 1024)
});

type RouteContext = { params: Promise<{ assetId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request.headers);
    const { assetId } = await context.params;
    const input = confirmUploadSchema.parse(await request.json());
    const asset = await prisma.audioAsset.findFirst({
      where: {
        id: assetId,
        session: { userId: user.id }
      },
      select: { id: true }
    });
    if (!asset) return jsonError("Audio asset not found", 404);

    const updated = await prisma.audioAsset.update({
      where: { id: assetId },
      data: {
        byteCount: input.byteCount,
        status: "COMPLETED"
      }
    });
    return NextResponse.json({ asset: updated });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
