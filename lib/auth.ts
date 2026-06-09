import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

const appBaseUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  "speakielts-ai-local-development-secret-replace-with-env-2026-06-04";

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
    "http://127.0.0.1:3002"
  ],
  plugins: [nextCookies()]
});

export type AuthSession = typeof auth.$Infer.Session;
