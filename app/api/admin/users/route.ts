import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/api/http";
import { handleAuthError, requireAdmin } from "@/lib/server/authGuards";

export async function GET(request: Request) {
  try {
    await requireAdmin(request.headers);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        targetBand: true,
        createdAt: true,
        _count: { select: { sessions: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return NextResponse.json({ users });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
