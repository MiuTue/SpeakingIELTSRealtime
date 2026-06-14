import Constants from "expo-constants";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { apiRequest } from "@/lib/api";

const INSTALLATION_ID_KEY = "speakielts:installation-id";

async function getInstallationId() {
  const existing = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (existing) return existing;
  const generated = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, generated);
  return generated;
}

export async function registerDevice() {
  const installationId = await getInstallationId();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  await apiRequest("/api/mobile/v1/devices", {
    method: "POST",
    body: JSON.stringify({
      installationId,
      platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
      appVersion,
      deviceName: Device.deviceName ?? undefined
    })
  });
}
