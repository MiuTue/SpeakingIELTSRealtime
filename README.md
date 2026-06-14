# SpeakIELTS AI

IELTS Speaking practice with a Next.js web app, an Expo iPhone app, Gemini Live,
hybrid audio scoring, Better Auth, PostgreSQL, and private server-side audio
storage.

## Repository

```text
app/                 Next.js pages and API routes
lib/                 auth, realtime, scoring, and backend services
mobile/              Expo React Native iPhone application
packages/contracts/  shared Zod contracts and TypeScript types
prisma/              PostgreSQL schema and migrations
```

The mobile architecture and decision log are documented in
[`docs/mobile-railway-architecture.md`](docs/mobile-railway-architecture.md).

## Local Backend

Use Node.js 20 or 22 LTS.

```bash
npm install --legacy-peer-deps
cp .env.example .env
npm run db:up
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

`db:push` is intended for a disposable local database. Railway uses committed
Prisma migrations through `npm run db:migrate`.

## Mobile

Create `mobile/.env`:

```bash
EXPO_PUBLIC_API_URL="http://YOUR_MAC_LAN_IP:3000"
```

The realtime PCM module requires an Expo development build and a physical iPhone.
Expo Go cannot run this application.

```bash
npm run mobile:typecheck
cd mobile
npx expo prebuild --clean
npx expo run:ios --device
```

For TestFlight, configure an Expo project and run:

```bash
cd mobile
npx eas build --platform ios --profile production
npx eas submit --platform ios --profile production
```

## Railway

1. Create a Railway project with a PostgreSQL service.
2. Connect this repository as a service.
3. Add the variables from `.env.example`.
4. Set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`.
5. Generate a Railway domain and use it for `BETTER_AUTH_URL` and
   `NEXT_PUBLIC_APP_URL`.
6. Deploy. `railway.toml` builds the app, runs `prisma migrate deploy`, starts
   Next.js, and checks `/api/mobile/v1/health`.

Do not deploy until the target database has a backup. If the existing database
was created with `prisma db push`, baseline its current schema before applying
the first committed migration.

## Audio Storage

Candidate audio is uploaded to the backend with a short-lived signed URL. The
database stores only metadata; audio files are written under `AUDIO_STORAGE_DIR`.

Local development can use the default:

```env
AUDIO_STORAGE_DIR=".data/audio"
```

On Railway, attach a Volume to the web service and mount it at:

```bash
/app/.data/audio
```

Then set:

```env
AUDIO_STORAGE_DIR="/app/.data/audio"
AUDIO_UPLOAD_SECRET="replace-with-at-least-32-random-characters"
```

## Verification

```bash
npm run db:generate
npm run typecheck
npm run mobile:typecheck
npm run test
npm run build
```

The final realtime check must be performed on a physical iPhone because acoustic
echo cancellation and microphone behavior are not representative in Simulator.
