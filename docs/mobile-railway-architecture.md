# Mobile and Railway Architecture

## Understanding Summary

- Keep the existing Next.js web application and backend.
- Add an Expo React Native iPhone application under `mobile/`.
- Reuse Better Auth accounts and sessions across web and mobile.
- Deploy the Next.js backend and PostgreSQL database on Railway.
- Keep PostgreSQL and Prisma as the source of truth.
- Use server-side audio storage on a Railway Volume for private, temporary candidate audio.
- Connect mobile directly to Gemini Live with a short-lived ephemeral token issued by the backend.

## Assumptions

- The first release is for one personal iPhone user.
- Android and iPad are not release targets.
- Live practice requires a network connection.
- History summaries and settings may be read from a local cache.
- Audio is private and expires after 24 hours by default.
- Scoring should usually finish in 5-10 seconds and remain retryable for up to 45 seconds.
- Distribution uses an Expo development build first and TestFlight afterward.
- The project is maintained by one developer, so low operational complexity is preferred.

## Non-Goals

- Offline live exams.
- Public App Store launch in the first release.
- Android or tablet layouts.
- Firebase Auth, Firestore, or Firebase Storage migration.
- Long-term audio storage.
- A Railway WebSocket relay for Gemini audio.

## Selected Approach

The Expo client uses Railway as a backend-for-frontend for authentication,
application data, upload authorization, scoring, and Gemini token provisioning.
It connects directly to Gemini Live after receiving a constrained ephemeral token.
Candidate audio uploads to the Railway backend using a short-lived signed URL,
then the backend writes the file to `AUDIO_STORAGE_DIR`.

```text
Expo iOS
  |-- Better Auth session in SecureStore
  |-- REST /api/mobile/v1/* ------------> Railway Next.js
  |-- Gemini Live WebSocket ------------> Google Gemini
  `-- signed audio upload --------------> Railway Next.js

Railway Next.js
  |-- Better Auth
  |-- Prisma ---------------------------> Railway PostgreSQL
  |-- Audio files -----------------------> Railway Volume
  `-- Gemini token/scoring -------------> Google Gemini
```

## Mobile Navigation

The application has four top-level tabs:

1. Home: progress, latest score, and resumable session.
2. Practice: Part 1, Part 2, Part 3, Full Test, and custom topic setup.
3. History: cached, virtualized session list and report details.
4. Profile: account, target band, voice, privacy, and sign out.

The live exam and report screens are full-screen stack routes outside the tab bar.

## Live Session State

```text
idle -> preparing -> connecting -> examiner_speaking
     -> candidate_speaking -> processing_turn
     -> examiner_speaking | completing -> scoring -> report
```

- The completed examiner transcript is the displayed question.
- Every turn has a stable `clientTurnId` to deduplicate reconnects.
- The UI never asks Gemini to repeat a question only to synchronize display text.
- Moving to background stops the microphone, closes the socket, and persists a checkpoint.
- Returning to foreground reloads the server checkpoint before requesting a new token.
- A completed examiner turn is not replayed after reconnect.
- Network retry uses exponential backoff with jitter and a visible recovery action.

## Data Model

### MobileDevice

Tracks a user's installation, platform, app version, and last active time.

### SpeakingSession

Adds checkpoint data, pause/resume timestamps, and a version for optimistic updates.

### SpeakingTurn

Adds a stable client-generated ID, ordering, synchronization state, and audio relation.

### AudioAsset

Stores only private object metadata: storage path, content type, byte count, upload
state, and expiration time.

### EvaluationJob

Tracks queued, processing, completed, and failed scoring work with retry metadata.

PostgreSQL remains authoritative. Mobile stores only session credentials, user
settings, history summaries, and a temporary active-session checkpoint.

## API Surface

All mobile application endpoints live under `/api/mobile/v1`.

- `GET /bootstrap`: user, settings, progress, resumable session, and app config.
- `GET|POST /sessions`: cursor-paginated history and session creation.
- `GET|PATCH /sessions/:id`: session details and checkpoint updates.
- `POST /sessions/:id/turns`: idempotent turn synchronization.
- `POST /sessions/:id/realtime-token`: constrained Gemini ephemeral token.
- `POST /sessions/:id/audio-upload`: short-lived backend upload authorization.
- `PUT /audio-assets/:assetId/upload`: tokenized binary audio upload.
- `POST /sessions/:id/evaluations`: create or return an idempotent scoring job.
- `GET /evaluations/:id`: scoring status and final report.
- `PATCH /settings`: profile and practice preferences.
- `POST /devices`: register app version and installation metadata.
- `GET /health`: deployment health check.

Request and response bodies are validated with shared Zod contracts. Mutating
requests accept an idempotency key. Authorization checks both authentication and
resource ownership.

## Authentication and Security

- Better Auth is the only identity system.
- Expo stores Better Auth cookies/session material with `expo-secure-store`.
- Gemini API keys and upload signing secrets never enter the mobile bundle.
- The backend never falls back to returning a raw Gemini API key to mobile.
- Gemini tokens are short-lived, single-use where supported, and constrained to
  the configured Live model.
- Audio files are private and addressed by user/session-scoped paths.
- Upload authorization validates MIME type and maximum size.
- Production logs omit audio, transcripts, cookies, tokens, and signed URLs.
- HTTPS is mandatory. Certificate pinning is deferred until the Railway domain is
  stable enough to support safe certificate rotation.

## Reliability

- Server mutations are idempotent.
- The active session checkpoint is persisted after each completed examiner or user turn.
- Reconnect obtains a fresh Gemini token.
- Audio upload retries at most three times.
- Scoring retries once for transient failures and falls back to transcript-only when possible.
- A cleanup job should delete expired audio files after 24 hours.
- Health checks cover the application process; readiness checks verify required configuration.
- Database migrations run as a release command before the new Railway deployment starts.

## Testing

- Vitest covers contracts, checkpoint transitions, idempotency, and backend services.
- API integration tests cover authentication and ownership.
- React Native Testing Library covers loading, empty, offline, and error states.
- Maestro covers sign-in, starting practice, foreground recovery, and report viewing.
- Gemini and audio storage integrations use adapters so tests do not call production services.
- Final microphone, audio playback, interruption, and lifecycle behavior must be tested on a real iPhone.

## Mobile Checkpoint

```text
Platform:     iPhone / iOS
Framework:    Expo React Native with Expo Router and development builds
Files Read:   mobile-design-thinking.md, touch-psychology.md,
              mobile-performance.md, mobile-backend.md,
              mobile-testing.md, mobile-debugging.md, platform-ios.md

3 Principles I Will Apply:
1. Use iOS conventions, safe areas, Dynamic Type, and 44pt minimum targets.
2. Keep realtime media work isolated from render state and clean up every native resource.
3. Treat the server as authoritative while providing explicit cached and recovery states.

Anti-Patterns I Will Avoid:
1. Long lists in ScrollView, unstable keys, and unnecessary render-driven audio work.
2. Raw secrets, session tokens in AsyncStorage, sensitive logs, and gesture-only actions.
```

## Decision Log

| Decision | Alternatives | Reason |
| --- | --- | --- |
| Add `mobile/` and keep web/backend. | Replace web; separate repositories. | Preserves working functionality and shared domain code. |
| Use Expo development builds and TestFlight. | Expo Go; native Swift app. | Supports native audio and secure storage with the existing TypeScript skill set. |
| Keep Better Auth. | Firebase Auth. | Avoids duplicate identities and migration. |
| Keep PostgreSQL/Prisma. | Firestore; MongoDB. | Existing data is relational and already modeled in Prisma. |
| Use Railway Volume for audio. | Firebase Storage; database blobs. | Removes Firebase, keeps deploy simple for one-user usage, and avoids storing binary audio in Postgres. |
| Connect mobile directly to Gemini Live. | Railway media relay. | Lower latency, bandwidth, and operational cost. |
| Pause in background and restore. | Background microphone. | More reliable and privacy-preserving on iOS. |
| Cache history/settings only. | Full offline exams. | Keeps synchronization simple for a realtime product. |
| Use four tabs and full-screen exam/report. | Drawer; five tabs. | Matches four frequent destinations and keeps the exam focused. |
| Release for iPhone first. | Cross-platform first. | Matches the actual user and reduces the initial native test surface. |

## Key Risks

- Expo audio APIs and Gemini PCM framing must be validated on a physical iPhone.
- Better Auth cookie persistence must be verified across app restarts.
- Gemini Live preview endpoints or model names may change.
- Direct upload authorization must not permit arbitrary object paths.
- Railway Volume data should be backed up manually if audio retention becomes important.
- Schema changes require a staged Railway migration and backup before production.
