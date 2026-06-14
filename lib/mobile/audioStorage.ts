import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_TTL_MS = 10 * 60 * 1000;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export function createAudioUploadSlot(input: {
  assetId: string;
  userId: string;
  sessionId: string;
  baseUrl: string;
}) {
  const expiresAt = new Date(Date.now() + UPLOAD_TTL_MS);
  const storagePath = [
    "private",
    input.userId,
    input.sessionId,
    `${input.assetId}.wav`
  ].join("/");
  const uploadUrl = new URL(
    `/api/mobile/v1/audio-assets/${input.assetId}/upload`,
    input.baseUrl
  );
  uploadUrl.searchParams.set("expires", expiresAt.getTime().toString());
  uploadUrl.searchParams.set(
    "token",
    signUploadToken(input.assetId, expiresAt.getTime())
  );

  return {
    uploadUrl: uploadUrl.toString(),
    storagePath,
    expiresAt: expiresAt.toISOString()
  };
}

export function verifyAudioUploadToken(input: {
  assetId: string;
  expires: string | null;
  token: string | null;
}) {
  if (!input.expires || !input.token) return false;
  const expiresAt = Number(input.expires);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = signUploadToken(input.assetId, expiresAt);
  const actualBuffer = Buffer.from(input.token);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.byteLength !== expectedBuffer.byteLength) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function writeAudioAssetFile(input: {
  storagePath: string;
  bytes: ArrayBuffer;
}) {
  if (input.bytes.byteLength > MAX_AUDIO_BYTES) {
    throw new Error("Audio file is too large");
  }

  const root = getAudioStorageRoot();
  const destination = resolveStoragePath(root, input.storagePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(input.bytes));
}

function signUploadToken(assetId: string, expiresAt: number) {
  return createHmac("sha256", getUploadSecret())
    .update(`${assetId}:${expiresAt}`)
    .digest("hex");
}

function getUploadSecret() {
  return (
    process.env.AUDIO_UPLOAD_SECRET ??
    process.env.BETTER_AUTH_SECRET ??
    "speakielts-local-audio-upload-secret"
  );
}

function getAudioStorageRoot() {
  return path.resolve(process.env.AUDIO_STORAGE_DIR ?? ".data/audio");
}

function resolveStoragePath(root: string, storagePath: string) {
  const resolved = path.resolve(root, storagePath);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid audio storage path");
  }
  return resolved;
}
