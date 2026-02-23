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
- `SUPABASE_SERVICE_ROLE_KEY`
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
5. Run analysis
6. Show results:
   - speaking rate
   - fillers
   - pauses (estimated ok)
   - next actions checklist
7. Return to project page:
   - session list
   - simple trend for speakingRateWpm
