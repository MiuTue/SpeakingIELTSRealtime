import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";
import { createGeminiLiveToken } from "@/lib/mobile/geminiTokens";

export async function POST(request: Request) {
  try {
    await requireUser(request.headers);
    const provisioned = await createGeminiLiveToken();
    return NextResponse.json(
      { token: provisioned.token, isRawKey: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    if (
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured"
    ) {
      return jsonError(error.message, 500);
    }
    return handleRouteError(error);
  }
}
