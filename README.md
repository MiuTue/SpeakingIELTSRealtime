# SpeakIELTS AI

Realtime IELTS Speaking MVP foundation built with Next.js App Router, OpenAI Realtime, Prisma/PostgreSQL, Zustand, Tailwind CSS, and Framer Motion.

## Setup

1. Install Node.js 20 or 22 LTS. This project pins LTS Node because Next/Webpack can fail on current odd or experimental Node releases.
2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` from `.env.example` and set:

```bash
OPENAI_API_KEY=
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/speakielts_ai"
OPENAI_EVALUATOR_MODEL=gpt-4.1-mini
NEXT_PUBLIC_REALTIME_DEBUG=false
```

4. Start local Postgres and prepare the database:

```bash
npm run db:up
npm run db:generate
npm run db:push
npm run db:seed
```

5. Run the app:

```bash
npm run dev
```

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The practice room includes mock mode, so the UI and scoring panel can be tested before OpenAI and Postgres are configured.
