# Dev Reference

## Before every commit

```bash
npm run build && npx tsc --noEmit && npx biome check src && npm test
```

If everything passes, then commit:

```bash
git add <file>
git commit -m "short description of what changed"
git push
```

## Individual commands

| Command | What it does |
|---|---|
| `npm run build` | Compile TypeScript → `dist/` |
| `npx tsc --noEmit` | Type check (no output files) |
| `npx biome check src` | Lint + format check |
| `npm test` | Run all tests |
| `npm run dev` | Run locally without building |

## Fix lint errors automatically

```bash
npx biome check --write --unsafe src
```

## Branch strategy

- `main` — shippable state, merge here when a phase is done
- `feat/<name>` — one branch per phase (e.g. `feat/walkthrough`)
