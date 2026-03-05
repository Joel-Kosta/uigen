# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js + Turbopack)
npm run build        # Production build
npm run test         # Run all Vitest tests
npm run test -- --run src/lib/__tests__/file-system.test.ts  # Run a single test file
npm run lint         # ESLint
npm run setup        # First-time setup: install deps + Prisma generate + migrate
npm run db:reset     # Reset and re-migrate the SQLite database
npm run check-env    # Verify required environment variables
```

## Environment Variables

```env
ANTHROPIC_API_KEY=   # Optional — falls back to MockLanguageModel if missing
JWT_SECRET=          # JWT signing secret (defaults to "development-secret-key")
```

## Architecture

UIGen is a Next.js 15 (App Router) app where users describe React components in a chat interface and Claude generates them with live preview.

### Request Flow

1. User submits message → `ChatContext` (`useAIChat` hook from Vercel AI SDK)
2. `POST /api/chat` — streams Claude's response using `streamText`
3. Claude calls tools (`str_replace_editor`, `file_manager`) to create/edit files
4. `FileSystemContext.handleToolCall` processes tool results, mutating the in-memory `VirtualFileSystem`
5. `PreviewFrame` re-renders the component by compiling JSX via `@babel/standalone` in the browser
6. On finish, the chat + file system state is saved to the `Project` DB record as JSON strings

### Virtual File System (`src/lib/file-system.ts`)

All generated files live in an in-memory `VirtualFileSystem` — nothing is written to disk. The FS is serialized to JSON and stored in `Project.data`. The preview always reads from `/App.jsx` as the entry point. The two AI tools that operate on it:

- `str_replace_editor` — view, create, str_replace, insert operations on files
- `file_manager` — rename and delete files/directories

### AI Provider (`src/lib/provider.ts`)

- **Real**: `anthropic("claude-haiku-4-5")` when `ANTHROPIC_API_KEY` is set
- **Mock**: `MockLanguageModel` when no key — generates preset Counter/Form/Card components for local dev without API costs. Uses 4 max steps vs 40 for real Claude.

### State Management

Two React contexts wrap the entire app:
- `FileSystemContext` — owns the `VirtualFileSystem` instance and exposes file CRUD + `handleToolCall`
- `ChatContext` — owns chat history, wires `useAIChat` to `/api/chat`, passes `files` serialization in each request

### Auth & Sessions (`src/lib/auth.ts`)

JWT-based, stored in HTTP-only cookies (7-day expiry). `src/middleware.ts` protects `/api/projects` and `/api/filesystem`. All auth mutations are Next.js Server Actions in `src/actions/`.

### Database

SQLite via Prisma. Two models: `User` and `Project`. `Project.messages` and `Project.data` are JSON strings (chat history and serialized VirtualFileSystem respectively). Schema is at `prisma/schema.prisma`.

### Anonymous User Flow

Unauthenticated users can generate components; work is tracked in sessionStorage via `src/lib/anon-work-tracker.ts`. On sign-in, `handlePostSignIn` converts the anonymous work into a new project.

### `node-compat.cjs`

Injected via `NODE_OPTIONS='--require ./node-compat.cjs'`. Deletes `globalThis.localStorage/sessionStorage` on the server to fix a Node.js 25+ compatibility issue where these globals exist but are non-functional, breaking SSR guards.

### Key Directory Layout

```
src/
  app/
    api/chat/route.ts       # Main streaming AI endpoint
    [projectId]/page.tsx    # Project workspace page
    main-content.tsx        # Root 3-panel layout
  components/
    chat/                   # ChatInterface, MessageList, MessageInput
    editor/                 # CodeEditor (Monaco), FileTree
    preview/                # PreviewFrame (Babel + React in browser)
    auth/                   # AuthDialog, SignInForm, SignUpForm
    ui/                     # Radix UI wrappers
  lib/
    file-system.ts          # VirtualFileSystem class
    provider.ts             # AI model selection + MockLanguageModel
    auth.ts                 # JWT session helpers
    contexts/               # FileSystemContext, ChatContext
    prompts/                # Claude system prompt for generation
    tools/                  # str_replace_editor and file_manager tool builders
  actions/                  # Server Actions: auth + project CRUD
  middleware.ts             # Route protection
prisma/
  schema.prisma
  dev.db                    # SQLite database (gitignored)
```
