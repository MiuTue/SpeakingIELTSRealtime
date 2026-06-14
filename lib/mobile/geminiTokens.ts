import { GoogleGenAI, Modality } from "@google/genai";
import { GEMINI_LIVE_MODEL } from "@/lib/realtime/sessionConfig";

const TOKEN_LIFETIME_MS = 30 * 60 * 1000;
const NEW_SESSION_WINDOW_MS = 60 * 1000;

export async function createGeminiLiveToken() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const client = new GoogleGenAI({ apiKey });
  const expireTime = new Date(Date.now() + TOKEN_LIFETIME_MS).toISOString();
  const newSessionExpireTime = new Date(
    Date.now() + NEW_SESSION_WINDOW_MS
  ).toISOString();
  const token = await client.authTokens.create({
    config: {
      uses: 1,
      expireTime,
      newSessionExpireTime,
      liveConnectConstraints: {
        model: GEMINI_LIVE_MODEL.replace(/^models\//, ""),
        config: {
          sessionResumption: {},
          responseModalities: [Modality.AUDIO]
        }
      },
      httpOptions: {
        apiVersion: "v1alpha"
      }
    }
  });

  if (!token.name) {
    throw new Error("Gemini did not return an ephemeral token");
  }

  return {
    token: token.name,
    model: GEMINI_LIVE_MODEL,
    websocketUrl:
      "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained",
    expiresAt: expireTime
  };
}
