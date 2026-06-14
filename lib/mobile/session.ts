import type { Prisma } from "@prisma/client";
import type { MobileSessionSummary } from "@speakielts/contracts";

type SessionRecord = {
  id: string;
  mode: MobileSessionSummary["mode"];
  topic: string;
  targetBand: number;
  status: MobileSessionSummary["status"];
  finalBand: number | null;
  durationSeconds: number;
  startedAt: Date;
  endedAt: Date | null;
  version: number;
};

export function toMobileSessionSummary(session: SessionRecord): MobileSessionSummary {
  return {
    id: session.id,
    mode: session.mode,
    topic: session.topic,
    targetBand: session.targetBand,
    status: session.status,
    finalBand: session.finalBand,
    durationSeconds: session.durationSeconds,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    version: session.version
  };
}

export function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function decodeCursor(cursor?: string) {
  if (!cursor) return undefined;
  try {
    return Buffer.from(cursor, "base64url").toString("utf8");
  } catch {
    return undefined;
  }
}

export function encodeCursor(id?: string) {
  return id ? Buffer.from(id, "utf8").toString("base64url") : null;
}
