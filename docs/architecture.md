# SpeakIELTS AI Architecture

## Product Flow

- `/practice` creates a speaking session or launches mock mode.
- `/practice/[sessionId]` manages realtime status, transcript, feedback, timer, and debug events in Zustand.
- Practice mode shows feedback after each answer; full test hides feedback until the session ends.
- History and dashboard fetch API data client-side so static builds do not require a database connection.

## Realtime

- `POST /api/realtime/session` creates a short-lived OpenAI Realtime client secret for `gpt-realtime-mini`.
- The browser uses WebRTC directly with the ephemeral secret; `OPENAI_API_KEY` remains server-only.
- `OpenAIRealtimeClient` normalizes OpenAI data-channel events into app events.
- `AudioRecorder` owns mic permission, tracks, mute, analyser, and cleanup.
- `AudioStreamer` owns WebRTC remote audio and a small PCM queue for mock/fallback playback patterns.

## Scoring

- `/api/evaluate-answer` validates question, transcript, mode, part, topic, and target band.
- `lib/scoring/evaluator.ts` calls the Responses API with `OPENAI_EVALUATOR_MODEL`, defaulting to `gpt-5-mini`.
- If no API key is configured, it returns deterministic mock feedback for local UI testing.

## Auth & Persistence

- Better Auth handles email/password sessions through Prisma.
- Prisma models cover `User`, Better Auth `Session`/`Account`/`Verification`, `SpeakingSession`, `SpeakingTurn`, and `UserProgress`.
- User APIs read from the authenticated session user; admin APIs require `UserRole.ADMIN`.
