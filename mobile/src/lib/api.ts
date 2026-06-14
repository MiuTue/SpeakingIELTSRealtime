import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/config";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const cookie = authClient.getCookie();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "omit",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...init.headers
    }
  });

  const body = (await response.json().catch(() => null)) as
    | T
    | { error?: string }
    | null;
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? body.error
        : undefined;
    throw new ApiError(message || "Request failed", response.status);
  }
  return body as T;
}
