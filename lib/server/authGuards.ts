import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type AuthSession } from "@/lib/auth";
import { jsonError } from "@/lib/api/http";

export async function getCurrentSession(headersInit?: Headers) {
  return auth.api.getSession({
    headers: headersInit ?? (await headers())
  });
}

export async function requireUser(headersInit?: Headers) {
  const session = await getCurrentSession(headersInit);
  if (!session?.user) {
    throw new AuthRequiredError();
  }
  return session as AuthSession;
}

export async function requireAdmin(headersInit?: Headers) {
  const session = await requireUser(headersInit);
  if (session.user.role !== "ADMIN") {
    throw new AdminRequiredError();
  }
  return session;
}

export async function requireUserPage() {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/sign-in");
  return session as AuthSession;
}

export async function requireAdminPage() {
  const session = await requireUserPage();
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthRequiredError) return jsonError("Authentication required", 401);
  if (error instanceof AdminRequiredError) return jsonError("Admin access required", 403);
  return null;
}

export class AuthRequiredError extends Error {}
export class AdminRequiredError extends Error {}
