# Reenter — Session Memory

## Project State
TypeScript migration completed. Tool runs from `dist/index.js` (built by tsup).
Source is in `src/**/*.ts`. Dev runs via `tsx src/index.ts`.

## Tech Stack (current)
- Runtime: Node.js ESM, TypeScript strict mode
- Build: tsup → dist/index.js (single bundle, ESM, shebang via banner)
- Types: All AI response shapes validated with Zod schemas in src/types.ts
- Linting: Biome (v2, biome.json)
- Testing: Vitest (infrastructure set up, no tests written yet)
- Dev: `npm run dev` → tsx | Build: `npm run build` → tsup | Lint: `npm run check`

## Key Architecture Decisions
- Single Anthropic client created in index.ts, passed to functions that need it
- Zod schemas in src/types.ts are the source of truth for all AI response shapes
- Session interface typed in src/types.ts — Session is the spine passed everywhere
- think() in prompt.ts now accepts (label, stream, transform: (text: string) => T)
  — text extracted inside think(), not in the caller

## File Structure
src/
  index.ts        — entry, creates Anthropic client, wires phases
  session.ts      — createSession, logHistory, logCheck
  prompt.ts       — reenterSelect, think, spin, reenterInput, green
  types.ts        — Zod schemas + TS types (Option, Session, Question, etc.)
  scout/
    directory.ts  — scanDirectory
    files.ts      — readKeyFiles
    analyze.ts    — analyzeProject(client, structure, keyFiles) → Analysis
  briefing/
    interview.ts  — runInterview(client, session) → boolean
    present.ts    — placeholder
    precheck.ts   — placeholder
  walkthrough/
    steps.ts / check.ts / respond.ts — placeholders

## Where We Are
- [x] TypeScript migration complete
- [x] Zod validation on all AI responses
- [x] Biome linting + formatting enforced
- [x] Vitest infrastructure in place
- [x] Scout + Briefing phases working end-to-end
- [ ] Walkthrough phase (next)
- [ ] Mode 2, Mode 3
- [ ] First-run API key setup (~/.config/reenter/)
- [ ] Tests written

## User Preferences
- Ryan values design-before-code discussions
- Meta-commands: -cp (checkpoint), -decide, -offtrack
- Never commit without explicit ask
