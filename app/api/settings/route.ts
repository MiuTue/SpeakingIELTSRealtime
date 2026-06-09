import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

const settingsSchema = z.object({
  name: z.string().min(1).max(80),
  targetBand: z.coerce.number().min(4).max(9)
});

export async function PATCH(request: Request) {
  try {
    const { user } = await requireUser(request.headers);
    const input = settingsSchema.parse(await request.json());
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: input,
      select: { id: true, name: true, email: true, role: true, targetBand: true }
    });
    return NextResponse.json({ user: updated });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
