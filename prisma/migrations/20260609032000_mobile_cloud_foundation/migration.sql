CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "PracticeMode" AS ENUM ('PART1', 'PART2', 'PART3', 'FULL_TEST', 'CUSTOM');
CREATE TYPE "SpeakingPart" AS ENUM ('PART1', 'PART2', 'PART3');
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'SCORING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "MobilePlatform" AS ENUM ('IOS', 'ANDROID');
CREATE TYPE "TurnSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');
CREATE TYPE "AudioUploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED', 'EXPIRED');
CREATE TYPE "EvaluationJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "targetBand" DOUBLE PRECISION NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpeakingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "PracticeMode" NOT NULL,
    "topic" TEXT NOT NULL,
    "targetBand" DOUBLE PRECISION NOT NULL,
    "voice" TEXT NOT NULL DEFAULT 'Aoede',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "finalBand" DOUBLE PRECISION,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "checkpointJson" JSONB,
    "pausedAt" TIMESTAMP(3),
    "resumedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "SpeakingSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpeakingTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "part" "SpeakingPart" NOT NULL,
    "question" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "estimatedBand" DOUBLE PRECISION,
    "feedbackJson" JSONB,
    "audioUrl" TEXT,
    "clientTurnId" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "syncStatus" "TurnSyncStatus" NOT NULL DEFAULT 'SYNCED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpeakingTurn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avgBand" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fluencyAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lexicalAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grammarAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pronunciationAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalSpeakingMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MobileDevice" (
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

CREATE TABLE "AudioAsset" (
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

CREATE TABLE "EvaluationJob" (
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

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");
CREATE INDEX "SpeakingSession_userId_startedAt_idx" ON "SpeakingSession"("userId", "startedAt");
CREATE INDEX "SpeakingSession_userId_status_idx" ON "SpeakingSession"("userId", "status");
CREATE INDEX "SpeakingTurn_sessionId_createdAt_idx" ON "SpeakingTurn"("sessionId", "createdAt");
CREATE UNIQUE INDEX "SpeakingTurn_sessionId_clientTurnId_key" ON "SpeakingTurn"("sessionId", "clientTurnId");
CREATE UNIQUE INDEX "UserProgress_userId_key" ON "UserProgress"("userId");
CREATE INDEX "MobileDevice_userId_lastActiveAt_idx" ON "MobileDevice"("userId", "lastActiveAt");
CREATE UNIQUE INDEX "MobileDevice_userId_installationId_key" ON "MobileDevice"("userId", "installationId");
CREATE UNIQUE INDEX "AudioAsset_storagePath_key" ON "AudioAsset"("storagePath");
CREATE INDEX "AudioAsset_sessionId_createdAt_idx" ON "AudioAsset"("sessionId", "createdAt");
CREATE INDEX "AudioAsset_expiresAt_status_idx" ON "AudioAsset"("expiresAt", "status");
CREATE INDEX "EvaluationJob_sessionId_createdAt_idx" ON "EvaluationJob"("sessionId", "createdAt");
CREATE INDEX "EvaluationJob_status_createdAt_idx" ON "EvaluationJob"("status", "createdAt");
CREATE UNIQUE INDEX "EvaluationJob_sessionId_idempotencyKey_key" ON "EvaluationJob"("sessionId", "idempotencyKey");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpeakingSession" ADD CONSTRAINT "SpeakingSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpeakingTurn" ADD CONSTRAINT "SpeakingTurn_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "SpeakingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MobileDevice" ADD CONSTRAINT "MobileDevice_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "SpeakingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_turnId_fkey"
FOREIGN KEY ("turnId") REFERENCES "SpeakingTurn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EvaluationJob" ADD CONSTRAINT "EvaluationJob_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "SpeakingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
