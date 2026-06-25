# LessonPlay

**Turn any lesson into a playable game.**

LessonPlay is an AI-assisted creation tool for teachers and educational creators. Give it a concept or textbook chapter, choose a game direction, and follow the build as LessonPlay generates, previews, and publishes a playable learning experience.

> Status: portfolio prototype. The core generation and publishing workflows work, but the product is not yet positioned as a production classroom service.

![LessonPlay social card](./public/brand/lessonplay-social.png)

## What it does

The product guides creators through a short workflow:

1. **Describe** what students should learn.
2. **Choose** from focused game concepts proposed by the agent.
3. **Generate** the selected experience while build progress appears in chat.
4. **Preview** the playable game without leaving the conversation.
5. **Publish** a versioned, shareable game URL.

LessonPlay currently supports three generation paths:

- **Arcade mini-games** — self-contained HTML5 Canvas games with simple controls.
- **Chapter games** — template-driven experiences built on the shared Learn Loop engine.
- **ChemQuest labs** — structured chemistry investigations using a fixed mobile lab interface.

## Why this project exists

Most AI education tools produce notes, slides, or quizzes. LessonPlay explores a different question: can curriculum become an interactive mechanic that students learn by playing?

The agent is constrained to prioritize:

1. a game that runs reliably;
2. a game that is enjoyable enough to replay;
3. one accurate, load-bearing learning concept;
4. controls simple enough for young learners.

## Product capabilities

- Chat-based game ideation and iteration
- Real-time reasoning and build progress
- Generated-file and publish-status views
- Live sandboxed game preview with restart and fullscreen controls
- Versioned game and source persistence
- Clerk authentication and per-user chat history
- OpenAI API or ChatGPT Codex OAuth model access
- PostgreSQL persistence with Drizzle ORM
- Cloudflare R2/S3-compatible game publishing

## Technology

- Next.js 16, React 19, TypeScript, Tailwind CSS
- Vercel AI SDK and AI Elements
- OpenAI models with optional ChatGPT Codex OAuth
- Clerk authentication
- PostgreSQL and Drizzle ORM
- Cloudflare R2 through the S3 API
- Vite-based bundling for Learn Loop and ChemQuest projects
- Vitest

## Local setup

Prerequisites:

- Node.js 20+
- pnpm 10
- PostgreSQL
- Clerk application credentials
- OpenAI API access or a supported ChatGPT Codex OAuth connection
- Cloudflare R2 or another compatible S3 publishing target

```bash
git clone https://github.com/D33ADLOCK/lessonplay.git
cd lessonplay/my-app
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The required environment variables and safe placeholders are documented in [`.env.example`](./.env.example). Never commit `.env`.

## Verification

```bash
pnpm test
pnpm build
```

## Repository structure

```text
my-app/
├── app/                    # Next.js routes and APIs
├── components/             # Chat, preview, and shared UI
├── lib/agent/              # Agent prompt, tools, bundling, and persistence
├── lib/db/                 # Drizzle schema, queries, and migrations
├── skills/                 # Game-design and learning-game instructions
└── test/                   # Unit and integration tests

packages/
├── learn-loop-core/        # Shared learning-game engine and UI
└── learn-loop-template/    # Reusable game presentation templates

games/                      # Hand-built and generated reference games
```

## Current limitations

- The product requires external authentication, database, model, and object-storage services.
- Image controls are visible in the interface, but multimodal prompt delivery still needs a complete end-to-end product pass.
- Generated educational content should be reviewed by a teacher before classroom use.
- No measured learning-outcome claims are made.
- The current experience is a prototype, not a hardened multi-school platform.

## Portfolio launch plan

The initial showcase will use short demo videos and two representative generated games. The repository should only be made public after:

- a secret and history audit;
- setup verification from a clean clone;
- confirmation that demo URLs contain no private data;
- license and attribution review.

## Roadmap

- Finish multimodal lesson input
- Add a public gallery of generated games
- Improve teacher controls for age, curriculum, and session length
- Add structured playtesting and learning-review checkpoints
- Capture reusable analytics without collecting student personal data

## Attribution

LessonPlay began from Vercel's Apache-2.0-licensed v0 clone example and retains the original license notice. The current product replaces the original generation backend and product workflow with a custom educational-game agent, Learn Loop templates, ChemQuest investigations, versioned publishing, and ChatGPT Codex OAuth support.

Additional game-design skills were adapted from [`abagames/claude-one-button-game-creation`](https://github.com/abagames/claude-one-button-game-creation); see the relevant notices and source licenses.

## License

See [LICENSE](./LICENSE).
