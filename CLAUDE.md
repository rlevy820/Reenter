# Reenter — Project Briefing for Claude

**Authors:** Ryan Levy & Claude

Read this before doing anything. This is the context for every session.

---

## What This Is

A terminal-based tool for self-taught builders who have a graveyard of old projects they can't get back into. You point it at an old project, it reads it, and guides you back in — one question at a time.

---

## Who It's For

Built by and for self-taught developers who:
- Build across many domains (web, hardware, data, mobile, etc.)
- Learn by doing, not by formal education
- Have old projects they'd like to revive, showcase, or open source
- Think in momentum, not whiteboards

---

## Core Principles (never violate these)

- **Deterministic flow** — every question has a purpose, every answer leads somewhere specific. No willy nilly.
- **LLM powered** — intelligent enough to adapt to any project type, language, or structure
- **One thing at a time** — never overwhelming, always a clear next step. Lightweight is a hard constraint, not a preference. Agents that try to do everything at once is the exact problem this tool is solving for — it would be ironic to build it that way.
- **Plain english** — speak like a senior dev who teaches well, not a textbook. Short, clear, a bit of context/history when useful.
- **Read before touch** — never change anything without explicit user approval
- **Design before code** — the conversation tree and experience must be fully designed before any coding begins. Never hear a problem and immediately jump to "let's start coding." That's the failure mode this project was born from.
- **Phase gates** — each phase has an explicit done signal before moving to the next. Don't bleed phases together. Ask the user if they're ready to move on.
- **Build for the user first** — this was built for one specific person. Don't over-engineer, don't design for hypothetical users, don't add features that weren't asked for.

---

## Division of Labor

The user brings taste, judgment, and the call on what feels right. Claude brings knowledge of what's technically possible, what patterns exist, and what the tradeoffs are. Decisions always belong to the user. Claude presents options — never makes choices unilaterally.

---

## North Star Principle

Minimality in actions towards moving to the north star. If it's worth detouring a mile to get a special gas that will make getting to the moon sweeter, consider it and talk about it. If it means traveling 100 miles and delaying the moon by a year, maybe not.

When an exciting technical option comes up in a session — flag it, discuss it briefly, then park it or drop it and get back on the road. Ryan tends to explore broadly and values that creativity, but the job is to balance making something new and great with actually getting somewhere.

---

## The Failure Mode to Never Repeat

The user has been burned by AI that hears a problem and immediately jumps to action. Doing the right thing in the wrong way is still wrong. The way this tool does things matters more than what it does. When in doubt, slow down and ask.

---

## The Four Modes

Fixed menu — never AI-derived. Always the same four options in this order:

1. **Browse** — understand it like it was built yesterday. Find the conceptual path from A to Z.
2. **Run** — see it running live on your machine. Lowest friction path to just seeing it alive again.
3. **MVP** — find the fastest path to real users. Local to something others can actually use.
4. **Ship** — clean it up and take it all the way. Modernize, fix issues, deploy properly.

---

## The First Moment

Tool reads the project, shows a plain english summary (always starts with "This looks like..."), then asks:

**What's next:**

Fixed menu — arrow keys, four options. No free text. The answer to this shapes everything that follows.

---

## Voice and Tone

- Senior dev who is great at teaching
- Speaks to a fairly technical but self-taught builder
- Plain english first, jargon only when necessary and explained
- Short responses, one thing at a time
- Occasional history/context tidbits when they help understanding
- Never assumes formal CS knowledge

---

## Technical Stack

- **Runtime:** Node.js CLI tool — runs in any terminal, installable globally via npm
- **Language:** TypeScript (strict mode) — all source in `src/`, compiled to `dist/` via tsup
- **LLM:** Anthropic API directly (no middleware)
- **Model strategy:** Use the right model for the job
  - `claude-haiku-4-5` — lightweight steps: reading files, summarizing structure, cheap tasks
  - `claude-sonnet-4-6` — reasoning heavy steps: finding the door back in, refactor proposals
- **Interactive prompts:** `@inquirer/core` — custom components, we own every pixel
- **Validation:** Zod — every AI response shape is validated at runtime, not assumed
- **Build:** tsup — single ESM bundle, shebang injected automatically
- **Linting/formatting:** Biome — one tool, zero config drift
- **Testing:** Vitest — infrastructure in place, tests written as features complete
- **Future:** OpenRouter for multi-model support is a north star, not a day one concern

---

## Meta-Commands (for dev sessions with Claude)

These are commands Ryan calls during a session to trigger specific actions. Claude can suggest them but never calls them unilaterally.

- `-cp` — checkpoint: stop, reflect, update CLAUDE.md with what was just decided
- `-decide` — we've been discussing long enough, time to make a call and document it
- `-offtrack` — we're drifting from the north star, pull back

Note: slash commands are reserved by Claude Code. All Reenter meta-commands use `-` prefix.

Claude should *suggest* these when it notices a checkpoint moment, a decision lingering, or drift happening — but Ryan pulls the trigger.

---

## The Meta Insight

The way this project is being built mirrors how the product should feel. The conversation between Ryan and Claude — sometimes chatting, sometimes working, sometimes teaching, sometimes providing instructions — shifting modes fluidly without feeling jarring. That's exactly what Reenter should do with the user. The dev process is the design spec.

Also: the graveyard of old projects is a source of pride, not shame. The user coming to Reenter isn't embarrassed — they're saying "this was cool and I want to honor it." The tool's voice should reflect that. It's archaeology, not cleanup.

---

## Run Mode — Walkthrough Design (Locked)

**Goal:** Lowest friction path to just seeing the project again. Not production ready. Just — what does this look like, can I poke around it.

**How it works:**
- Tool does all the technical thinking under the hood
- User never sees jargon — no "package.json", "env vars", "npm install"
- Chat mode once walkthrough starts — text input always available, agent leads but adapts
- Consent before every action — always shows what it's about to do and why
- Hybrid UI — select menus for structured choices, free text always available

**The full flow:**
1. Scout: scan silently, show "This looks like..." summary (Haiku)
2. Menu: What's next — Browse / Run / MVP / Ship
3. Walkthrough starts:
   a. **Save starting point** — git pre-flight, always first
   b. **Pre-flight assessment** — what does this project actually need to run?
   c. **Non-technical questions** — things only the user knows
   d. **Execution loop** — one step at a time, chat mode, consent before action

**Dependency tiers (Run mode):**
- **Tier 1 — hard blockers:** app won't start. Must resolve. (missing runtime, database not running, env var that crashes on boot)
- **Tier 2 — soft blockers:** app starts but a feature breaks. Explain and skip for Run. (Stripe, email, third-party APIs)
- **Tier 3 — silent fails:** app works, one page errors. Note it and move on.

**Git pre-flight (locked):**
- Always runs first, always shows "Saving your starting point" spinner
- No git → `git init` + commit everything (creates `.gitignore` if missing)
- Loose ends → silently commit everything
- Already clean → empty commit (`--allow-empty`)
- Commit message: `"saving starting point before reenter"`
- No branch created — the commit IS the restore point. User can always return to it.
- Only treats git as project's own if repo root === project path (parent repos ignored)
- Applies to Run, MVP, and Ship — not Browse

**Key principle:** The tool does the technical thinking. The user makes the human decision. Specific always, generic never. Honest always.

---

## Project Structure (locked)

```
src/
  index.ts          — entry point only, wires everything together
  session.ts        — the spine, holds all state for the entire session
  prompt.ts         — all custom terminal UI lives here
  types.ts          — Zod schemas + TypeScript types for all AI responses and session state

  scout/            — understands the project before anything happens
    directory.ts    — scans folder structure
    files.ts        — reads key files (package.json, README, etc.)
    analyze.ts      — Haiku builds the full high level map

  briefing/         — parked. orientation moment lives here (interview.ts), not yet wired in
    interview.ts    — generates one plain english sentence before step 1 (Sonnet)

  walkthrough/      — guided step-by-step execution
    git.ts          — save starting point before anything changes (BUILT)
    steps.ts        — manages step progression and state (stub)
    check.ts        — runs commands, captures output, reports back (stub)
    respond.ts      — handles what the user says at each step (stub)
```

**Why this structure:** Each folder has one job. Named after what they mean in the product, not what they do technically. Scout, Briefing, Walkthrough — anyone can navigate this at 2am.

---

## The Execution Pattern (locked)

This pattern repeats throughout the entire walkthrough phase:

```
AI knows what's needed for this step
↓
AI says why in plain english — short, specific, trustworthy
↓
"Can I check if you have it? Run this:" [shows exact command]
↓
> Yes, run it
  No, skip it
  [type something else]
↓
AI reads the real output and responds to what it actually found
↓
Move forward only when user confirms
```

Never assumes. Always checks. Always asks permission. Always shows what it's running and why.

---

## Known Issues / Polish Later

- API key setup flow not built yet — right now the key lives in Reenter's own `.env`. Future: first-run setup asks the user for their key and stores it in `~/.config/reenter/`.

---

## Where We Are

- [x] Problem defined
- [x] Core principles defined
- [x] Four modes defined — Browse / Run / MVP / Ship (fixed menu, locked copy)
- [x] First moment designed — summary always starts "This looks like...", prompt is "What's next:"
- [x] Voice and tone defined
- [x] README written
- [x] Git initialized
- [x] Project structure and DevOps foundation set up
- [x] Technical stack decided
- [x] Scout phase — scan + summary + step generation
- [x] Custom terminal UI (prompt.ts) — inline description on hover
- [x] TypeScript migration — strict mode, Zod validation, tsup build, Biome, Vitest (54 tests)
- [x] CI/CD — GitHub Actions, runs build + lint + tests on push/PR
- [x] Walkthrough step 1 — git pre-flight, "Saving your starting point" (BUILT)
- [ ] Walkthrough step 2 — pre-flight assessment (what does this project need to run?)
- [ ] Walkthrough step 3 — non-technical questions (things only the user knows)
- [ ] Walkthrough step 4 — execution loop (chat mode, consent before action)
- [ ] Browse, MVP, Ship modes (currently "coming soon")
- [ ] First-run API key setup flow
- [ ] Global install (`reenter` from anywhere)

---

## Next Step

Walkthrough step 2: pre-flight assessment. The AI reads the project and surfaces what it actually needs to run — in plain english, sorted by tier. Hard blockers first, soft blockers noted but skippable for Run mode.
