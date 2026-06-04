# Game Builder

Design and build fun, interactive educational mini-games with AI. Describe a
concept or paste a textbook chapter, pick from a few proposed game ideas, and
watch a playable, self-contained HTML game build in real time.

## How it works

1. **Ideate** — the agent reads your concept (or chapter) and proposes a few
   fun, arcade-style game ideas, then pauses for you to choose.
2. **Build** — once you pick an idea, the agent designs and writes a single
   self-contained HTML5 Canvas game and publishes it.
3. **Preview** — the published game streams into a live preview panel and is
   saved so you can iterate on it.

## Tech stack

- **Next.js** (App Router) with React Server Components
- **AI SDK v5** (`@ai-sdk/react` `useChat`) for streaming chat, reasoning, and
  live code generation
- **Clerk** for authentication
- **Drizzle ORM + PostgreSQL** for chats, messages, and game versions
- **S3-compatible object storage** for published game HTML

## Setup

### Environment variables

Create a `.env` file:

```bash
# PostgreSQL connection string
POSTGRES_URL=postgresql://user:password@localhost:5432/game_builder

# Clerk authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# OpenAI (used by the game-building agent)
OPENAI_API_KEY=your-openai-api-key

# S3-compatible storage for published games
R2_S3_ENDPOINT=your-s3-endpoint
R2_S3_REGION=your-region
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_BASE_URL=https://your-public-bucket-url
```

### Database

This project uses PostgreSQL with Drizzle ORM:

```bash
pnpm db:generate   # generate migrations from schema changes
pnpm db:migrate    # apply pending migrations
pnpm db:studio     # open Drizzle Studio (optional)
```

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

### Frontend

- `app/page.tsx` — home page; mints a chat id, stashes the first prompt, and
  navigates to the chat detail page
- `app/chats/[chatId]/page.tsx` — server component that seeds persisted history
- `components/chats/chat-detail-client.tsx` — `useChat`-driven chat + preview
- `components/chat/message-parts.tsx` — renders reasoning, text, and the live
  `publishGame` code stream

### Backend

- `app/api/chat/route.ts` — validates the request, lazily creates the chat,
  streams the model reply, and persists messages on finish
- `lib/agent/skills.ts` — the system prompt and injected design skills
- `lib/agent/tools.ts` — the `publishGame` and `readSkillReference` tools

### Database

- **chats** — one row per conversation (title, latest HTML, demo URL, owner)
- **messages** — conversation turns stored as JSONB UI messages
- **game_versions** — each published game's HTML and demo URL

## Database commands

- `pnpm db:generate` — generate migration files from schema changes
- `pnpm db:migrate` — apply pending migrations
- `pnpm db:studio` — open Drizzle Studio for inspection
- `pnpm db:push` — push schema changes directly (development only)

## Testing

```bash
pnpm test
```
