import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request.headers);
    return NextResponse.json({ user });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
