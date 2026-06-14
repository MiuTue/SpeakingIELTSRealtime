DO $$ BEGIN
  CREATE TYPE "MobilePlatform" AS ENUM ('IOS', 'ANDROID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TurnSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AudioUploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EvaluationJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "SessionStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "SessionStatus" ADD VALUE IF NOT EXISTS 'SCORING';

ALTER TABLE "SpeakingSession"
  ADD COLUMN IF NOT EXISTS "voice" TEXT NOT NULL DEFAULT 'Aoede',
  ADD COLUMN IF NOT EXISTS "checkpointJson" JSONB,
  ADD COLUMN IF NOT EXISTS "pausedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resumedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "SpeakingTurn"
  ADD COLUMN IF NOT EXISTS "clientTurnId" TEXT,
  ADD COLUMN IF NOT EXISTS "sequence" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "syncStatus" "TurnSyncStatus" NOT NULL DEFAULT 'SYNCED';

CREATE TABLE IF NOT EXISTS "MobileDevice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "installationId" TEXT NOT NULL,
  "platform" "MobilePlatform" NOT NULL,
  "appVersion" TEXT NOT NULL,
  "deviceName" TEXT,
  "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MobileDevice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AudioAsset" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "turnId" TEXT,
  "storagePath" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "byteCount" INTEGER,
  "status" "AudioUploadStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AudioAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EvaluationJob" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "EvaluationJobStatus" NOT NULL DEFAULT 'QUEUED',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "feedbackJson" JSONB,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvaluationJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SpeakingSession_userId_status_idx" ON "SpeakingSession"("userId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "SpeakingTurn_sessionId_clientTurnId_key" ON "SpeakingTurn"("sessionId", "clientTurnId");
CREATE INDEX IF NOT EXISTS "MobileDevice_userId_lastActiveAt_idx" ON "MobileDevice"("userId", "lastActiveAt");
CREATE UNIQUE INDEX IF NOT EXISTS "MobileDevice_userId_installationId_key" ON "MobileDevice"("userId", "installationId");
CREATE UNIQUE INDEX IF NOT EXISTS "AudioAsset_storagePath_key" ON "AudioAsset"("storagePath");
CREATE INDEX IF NOT EXISTS "AudioAsset_sessionId_createdAt_idx" ON "AudioAsset"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "AudioAsset_expiresAt_status_idx" ON "AudioAsset"("expiresAt", "status");
CREATE INDEX IF NOT EXISTS "EvaluationJob_sessionId_createdAt_idx" ON "EvaluationJob"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "EvaluationJob_status_createdAt_idx" ON "EvaluationJob"("status", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "EvaluationJob_sessionId_idempotencyKey_key" ON "EvaluationJob"("sessionId", "idempotencyKey");

DO $$ BEGIN
  ALTER TABLE "MobileDevice" ADD CONSTRAINT "MobileDevice_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "SpeakingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_turnId_fkey"
  FOREIGN KEY ("turnId") REFERENCES "SpeakingTurn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EvaluationJob" ADD CONSTRAINT "EvaluationJob_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "SpeakingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
