# Vibe Coding Rules (PitchLoop)

## Scope
- Keep the MVP loop tight: project -> session -> upload -> analyze -> next actions.
- Prefer deterministic heuristics over complex ML.
- Avoid scope creep; only build what the demo needs.

## Architecture
- Prefer Server Actions for mutations; minimize client components.
- Keep business logic in `lib/` and validate inputs with Zod.
- Store media in Supabase Storage; store metadata in Postgres.
- No secrets in git. `.env.local` only; keep `.env.example` updated.

## UX / Demo Flow
- Optimize for a 2-3 minute demo.
- The core flow should be obvious with minimal clicks.
- Always show at least one clear trend metric on the project page.

## Quality Gates
- `npm run lint` and `npm run build` must pass.
- Playwright smoke test should cover the core flow.

## Commit Discipline
- Small, single-intent commits.
- Update README when setup or env vars change.
