export function getIdempotencyKey(request: Request, fallback?: string) {
  const key = request.headers.get("idempotency-key")?.trim() || fallback?.trim();
  if (!key || key.length < 8 || key.length > 200) {
    throw new Error("A valid Idempotency-Key header is required");
  }
  return key;
}
