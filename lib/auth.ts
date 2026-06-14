import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { expo } from "@better-auth/expo";
import { prisma } from "@/lib/db";

const appBaseUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const authSecret = getAuthSecret();

export const auth = betterAuth({
  appName: "SpeakIELTS AI",
  baseURL: appBaseUrl,
  secret: authSecret,
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false
      },
      targetBand: {
        type: "number",
        required: false,
        defaultValue: 7
      }
    }
  },
  trustedOrigins: [
    appBaseUrl,
    process.env.NEXT_PUBLIC_APP_URL ?? appBaseUrl,
    process.env.BETTER_AUTH_URL ?? appBaseUrl,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "speakielts://",
    "speakielts://*",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost",
    "http://127.0.0.1",
    "https://*.ngrok-free.app",
    "https://*.ngrok-free.dev",
    "https://*.ngrok.io",
    "https://*.ngrok.app",
    "https://*.ngrok.dev",
    ...(process.env.NODE_ENV === "development"
      ? [
          "exp://",
          "exp://**",
          "exp://192.168.*.*:*/**",
          "http://192.168.*.*:*",
          "http://192.168.*.*"
        ]
      : [])
  ],
  plugins: [expo(), nextCookies()]
});

export type AuthSession = typeof auth.$Infer.Session;

function getAuthSecret() {
  const configured = process.env.BETTER_AUTH_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET must be configured in production");
  }
  return "speakielts-ai-local-development-secret-replace-with-env-2026-06-04";
}
