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

## Where We Are

- [x] Problem defined
- [x] Core principles defined
- [x] Three modes defined
- [x] First moment designed
- [x] Voice and tone defined
- [x] README written
- [x] Git initialized
- [ ] Conversation tree mapped out (this is the next step)
- [ ] Technical stack decided
- [ ] Build begins

---

## Next Step

Map the conversation tree. For each of the three modes, design every question, every possible answer, and where each answer leads. This is the most important design work before any coding.

Start here: **Mode 1 — Just run it.** What's the first question after the user selects this? What are the possible answers? Where does each lead?
