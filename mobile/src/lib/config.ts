const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL = (rawApiUrl || "http://localhost:3000").replace(/\/$/, "");
export const APP_SCHEME = "speakielts";
