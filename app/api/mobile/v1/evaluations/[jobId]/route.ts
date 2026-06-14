import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRouteError, jsonError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(request.headers);
    const { jobId } = await context.params;
    const job = await prisma.evaluationJob.findFirst({
      where: {
        id: jobId,
        session: { userId: user.id }
      }
    });
    if (!job) return jsonError("Evaluation job not found", 404);
    return NextResponse.json({ job });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
