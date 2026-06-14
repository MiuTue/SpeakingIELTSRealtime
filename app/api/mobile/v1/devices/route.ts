import { NextResponse } from "next/server";
import { registerDeviceSchema } from "@speakielts/contracts";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request.headers);
    const input = registerDeviceSchema.parse(await request.json());
    const device = await prisma.mobileDevice.upsert({
      where: {
        userId_installationId: {
          userId: user.id,
          installationId: input.installationId
        }
      },
      create: {
        userId: user.id,
        ...input
      },
      update: {
        platform: input.platform,
        appVersion: input.appVersion,
        deviceName: input.deviceName,
        lastActiveAt: new Date()
      }
    });
    return NextResponse.json({ device }, { status: 201 });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
