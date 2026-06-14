import { NextResponse } from "next/server";
import { updateMobileSettingsSchema } from "@speakielts/contracts";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

export async function PATCH(request: Request) {
  try {
    const { user } = await requireUser(request.headers);
    const input = updateMobileSettingsSchema.parse(await request.json());
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: input,
      select: {
        id: true,
        name: true,
        email: true,
        targetBand: true
      }
    });
    return NextResponse.json({ user: updated });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
