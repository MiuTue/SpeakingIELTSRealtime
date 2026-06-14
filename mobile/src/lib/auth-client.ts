import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { API_URL, APP_SCHEME } from "@/lib/config";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: APP_SCHEME,
      storagePrefix: "speakielts",
      storage: SecureStore,
      cookiePrefix: "better-auth"
    })
  ]
});
