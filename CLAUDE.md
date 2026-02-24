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

## The Three Modes

1. **Just run it** — figure out what it would take to run this locally right now. What is it, what does it run on, does it have a db, does it need env vars, what's the MVP to get it running.
2. **Get back in** — reconstruct enough momentum to start developing again. Find the best door back in, not a full whiteboard.
3. **Refactor and clean it up** — restructure for readability and future building. Split monster files, rename folders, add READMEs, requirements.txt, simple docs. Same functionality, better skeleton.

---

## The First Moment

Tool reads the project, outputs a 1-2 sentence plain english summary of what it is, then asks:

**What do you want to do with it?**

Via interactive terminal prompt (arrow keys, radio buttons, "Other" option for free text). The answer to this shapes everything that follows.

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
- **LLM:** Anthropic API directly (no middleware)
- **Model strategy:** Use the right model for the job
  - `claude-haiku-4-5` — lightweight steps: reading files, summarizing structure, cheap tasks
  - `claude-sonnet-4-6` — reasoning heavy steps: finding the door back in, refactor proposals
- **Interactive prompts:** Inquirer.js — arrow keys, radio buttons, "Other" free text input
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

## Mode 1 — Just Run It (Design Decisions Locked)

**Goal:** Lowest friction path to just seeing the project again. Not setting it up properly, not production ready. Just — what does this look like, can I poke around it.

**How it works:**
- Tool scans the project and does all the technical thinking under the hood
- User never sees jargon — no "package.json", "env vars", "npm install"
- Tool figures out the complexity, then surfaces just enough to keep the user informed and in control
- Always specific to *this* project — never generic descriptions

**The flow:**
1. Tool scans silently (Haiku — cheap)
2. Outputs a plain english summary of what the project is
3. Presents 1-3 derived options with high level step map already attached
4. User picks one
5. Tool zooms into step 1 and walks through it (Sonnet — reasoning heavy)
6. One step at a time, human in the loop, until done

**Two-level planning model (GPS metaphor):**
- **Analysis phase (one call):** produces the full high level map — summary, options, and all steps end to end for each option. Like seeing the whole route before driving.
- **Execution phase (one call per step):** zooms into the current step only. Figures out exactly what it means for this specific project — what command, what might go wrong, what done looks like.
- Steps stay high level in the map. Detail only appears when you're on that step.

**JSON shape from analysis:**
```json
{
  "summary": "...",
  "options": [
    {
      "title": "Run it",
      "description": "get it working on your computer, ~20 min",
      "value": "run",
      "steps": [
        "Install the project's dependencies",
        "Set up the database",
        "Start the app and open it in your browser"
      ]
    }
  ]
}
```

**Options are derived, not templated:**
- No hardcoded slots — Claude figures out what's actually possible first
- Blocked paths get flagged honestly
- 1 to 3 options only. Never pad.

**Key principle:** The tool does the technical thinking. The user makes the human decision. Specific always, generic never. Honest always.

---

## Known Issues / Polish Later

- Summary output occasionally still uses light jargon ("server", "database") — prompt needs tightening to say "a place to live" and "a place to hold data" instead
- API key setup flow not built yet — right now the key lives in Reenter's own `.env`. Future: first-run setup asks the user for their key and stores it.

---

## Where We Are

- [x] Problem defined
- [x] Core principles defined
- [x] Three modes defined
- [x] First moment designed
- [x] Voice and tone defined
- [x] README written
- [x] Git initialized
- [x] Project structure and DevOps foundation set up
- [x] Technical stack decided
- [x] Mode 1 scan + derived options working
- [ ] Mode 1 step-by-step guidance after option selection — **this is next**
- [ ] Mode 2 built
- [ ] Mode 3 built
- [ ] First-run API key setup flow
- [ ] Global install so user can run `reenter` from anywhere

---

## Next Step

Build out what happens after the user picks an option in Mode 1. The tool currently says "Got it. Working on that next." — it needs to actually walk the user through step 1, wait for confirmation, handle errors in plain english, and move forward one step at a time.
