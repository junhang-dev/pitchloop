# Repository Guidelines

## Product Goal
PitchLoop is an MVP web app to practice presentations solo:
Create a project -> upload rehearsal media -> generate structured feedback -> manage next actions across iterations.

The #1 priority is a demo-ready end-to-end loop. Keep scope small.

## Tech Stack
- Next.js (App Router) + TypeScript
- shadcn/ui + Tailwind
- Supabase (Auth + Postgres + Storage)
- Vercel deploy
- Playwright E2E smoke tests
- MCP: Supabase MCP, GitHub MCP, Playwright MCP

## Architecture Rules
- Prefer Server Actions for mutations. Keep client components minimal.
- Keep business logic in `lib/` (pure functions where possible).
- Validate inputs with Zod schemas (`lib/validators`).
- Store media in Supabase Storage; store metadata in DB.
- Never commit secrets. Use `.env.local`. Keep `.env.example` updated.

## Folder Structure (expected)
- `app/` pages and routes (App Router)
- `components/` UI components (including shadcn under `components/ui`)
- `lib/` supabase clients, analysis logic, validators
- `supabase/migrations/` SQL migrations
- `tests/e2e/` Playwright tests
- `docs/` vibe-coding rules, demo scripts, decisions

## MCP Usage (mandatory where relevant)
- Supabase MCP:
  - create/update migrations
  - verify tables/columns
  - sanity-check queries and RLS
- GitHub MCP:
  - create issues for TODOs
  - open PRs with clear descriptions and test steps
- Playwright MCP:
  - maintain smoke tests for the core flow

## Definition of Done (MVP)
User can:
1) sign in
2) create project
3) create session
4) upload media
5) see analysis cards + next actions checklist
6) see sessions list + at least one trend metric on project page

Quality gates:
- `npm run lint` passes
- `npm run build` passes
- Playwright smoke test passes
- Vercel deploy works with documented env vars

## Commit / PR Discipline
- Small commits with single intent.
- Update README when env vars or setup changes.
- Add/adjust tests when changing critical flows.
