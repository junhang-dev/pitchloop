# PitchLoop

MVP web app to practice presentations solo. The goal is a demo-ready, end-to-end loop: create project -> record/upload -> analyze -> act on feedback.

## Local Setup
1. Install dependencies:
   - `npm install`
2. Create env file:
   - Copy `.env.example` to `.env.local` and fill in values.
3. Run the app:
   - `npm run dev`

## Environment Variables (Checklist)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for storage upload + deterministic E2E user setup)
- `GITHUB_TOKEN` (only needed for MCP GitHub server)
- `NEXT_PUBLIC_APP_URL` (default: `http://localhost:3000`)

## Commands
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- E2E smoke: `npm run test:e2e`

## MCP Servers
The MCP servers read from environment variables. Make sure `.env.local` is filled before launching any MCP client.

## Demo Steps (2-3 minutes)
1. Sign in
2. Create a project (title, goal, audience, duration)
3. Create a session
4. Upload rehearsal media
5. Paste transcript and click **Run Analysis**
6. Show results:
   - speaking rate
   - fillers
   - timeline markers (estimated)
   - feedback list
   - next actions checklist
7. Click **Generate Next Actions** and confirm checklist auto-populates from feedback
8. Return to project page:
   - session list
   - speakingRateWpm trend chart

## Known Limitations (Phase 2)
- Analysis is transcript-only and rule-based (no ASR, no acoustic pause detection).
- Timeline markers are estimated at fixed intervals and labeled as estimated.
- One latest analysis is displayed per session (new runs overwrite latest analysis content in UI flow).
- Next.js shows a middleware deprecation warning (`middleware` -> `proxy`) during dev/build; functional behavior is unchanged.
