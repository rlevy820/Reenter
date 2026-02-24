# Reenter — Ryan's Notes

This file is just for me. Plain english explanations of why each file exists and what it does. Not a doc for others, not read by Claude. Just future-me understanding past-me.

---

## package.json

Every Node.js project needs this file. Think of it as the project's ID card — it tells Node what the project is called, what version it's on, and most importantly, what external tools (called dependencies) the project needs to run. When you run `npm install`, Node reads this file to know what to download.

---

## CLAUDE.md

The briefing doc for Claude. Every time a new Claude Code session starts, Claude reads this first. It's how Claude knows the project's principles, decisions, and where we are — without needing to re-explain everything each session.

---

## README.md

The public-facing explanation of what Reenter is. This is what someone sees when they land on the GitHub repo. Written for anyone, not just me.

---

## LICENSE

The MIT license. This is a legal file that says anyone can use, copy, modify, and distribute this project as long as they keep the copyright notice. Without this file, nobody can legally use the code even if it's public on GitHub.

---

## .gitignore

Tells git which files to never track or commit. Things like `node_modules/` (huge folder of dependencies that can be reinstalled anytime), `.env` (contains secret keys that should never be public), and `.DS_Store` (Mac system file that has nothing to do with the project).

---

## .gitmessage

A template that shows up every time I write a commit message. Reminds me to use the `feat:`, `fix:`, `docs:` format so the git history stays readable.

