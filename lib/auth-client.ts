"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

const browserBaseURL = typeof window !== "undefined" ? window.location.origin : undefined;

export const authClient = createAuthClient({
  baseURL: browserBaseURL ?? process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    inferAdditionalFields({
      user: {
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
    })
  ]
});

export const { signIn, signOut, signUp, useSession } = authClient;
