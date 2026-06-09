import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

export async function POST(request: Request) {
  try {
    await requireUser(request.headers);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonError("GEMINI_API_KEY is not configured", 500);
    }

    const useEphemeralTokens = process.env.GEMINI_USE_EPHEMERAL_TOKENS === "true";

    if (!useEphemeralTokens || apiKey.startsWith("AQ.")) {
      return NextResponse.json({ token: apiKey, isRawKey: true });
    }

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1alpha/authTokens?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            uses: 1,
            expireTime,
            newSessionExpireTime,
          },
        }),
      });

      const responseText = await response.text();
      let data: { name?: string; error?: unknown } | null = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = { error: responseText || "Empty response from Gemini authTokens API" };
      }

      if (!response.ok || !data?.name) {
        console.error("Gemini Ephemeral Token API error, falling back to direct key:", {
          status: response.status,
          statusText: response.statusText,
          body: data ?? { error: "Empty response from Gemini authTokens API" }
        });
        return NextResponse.json({ token: apiKey, isRawKey: true });
      }

      return NextResponse.json({ token: data.name, isRawKey: false });
    } catch (fetchError) {
      console.error("Failed to generate ephemeral token, falling back to direct key:", fetchError);
      return NextResponse.json({ token: apiKey, isRawKey: true });
    }
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
