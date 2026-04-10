# Cadence

Cadence is a local-first execution intelligence app built with React, TypeScript, Vite, and IndexedDB.

## What this build is

Cadence helps a single user:
- define repeatable habits
- launch simple routines
- log actual outcomes quickly
- review the gap between plan and reality
- queue basic in-app reminders tied to scheduled instances

## What this build is not yet

This repository is deployable as a static app, but the runtime is still local-only.

That means:
- data lives in IndexedDB in one browser profile
- there is no backend persistence
- there is no auth
- there is no cross-device sync
- reminders are browser-session dependent

Use the current hosted build as a serious demo or local-first MVP preview, not as a durable multi-user production system.

## Recommended local folder name

Use one of these when you rename the workspace directory:
- `Cadence App`
- `cadence-execution-intelligence`

The current `Hyrox App` folder path is legacy naming only and should be cleaned once the directory is no longer locked by external tools.

## Local development

```bash
npm install
npm run dev
```

## Local production preview

```bash
npm run build
npm run preview
```

## Deploy readiness gate

```bash
npm run test:smoke
```

This runs:
- lint
- production build
- Playwright end-to-end smoke coverage

## Environment variables

See `.env.example`.

Current variables:
- `VITE_APP_TITLE`
- `VITE_BASE_PATH`

Notes:
- leave `VITE_BASE_PATH` empty for local development and root hosting
- use `VITE_BASE_PATH=/cadence/` for the GitHub Pages deployment target

## Deployment target recommendation

Recommended first host:
- GitHub Pages

Good alternatives:
- Vercel
- Netlify
- Cloudflare Pages

Why:
- the app is frontend-only today
- static deployment is enough for the current runtime
- GitHub Pages can host it fully free
- the existing `build:pages` path is aligned to the `/cadence/` deploy target

## Live review URL

Use this URL for post-deploy human review once the GitHub Pages site is publishing with the Cadence path:

`https://km-webdvlpr.github.io/cadence/`

## Persistence and deployment implications

What is local-only:
- all user data
- reminder queue state
- review history
- everything is stored in the browser via IndexedDB

What is deploy-ready:
- static asset hosting
- client-side routing
- local browser persistence
- in-app reminder surfacing

What is still needed before a true live product:
1. backend database
2. auth
3. sync model
4. export/import or migration path
5. server-driven reminders

Those are future upgrades, not blockers for the current GitHub Pages-hosted demo build.

## Quality checks

```bash
npm run lint
npm run build
npm run test:e2e
```

For deploy candidates, prefer:

```bash
npm run test:smoke
```

## Additional docs

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [PRODUCTION_SMOKE_CHECKLIST.md](./PRODUCTION_SMOKE_CHECKLIST.md)

## MVP notes carried forward

- pause/archive prunes future planned instances as an intentional MVP simplification
- weighted partials remain part of weekly review semantics
- moved instances are excluded from adherence denominators
- timezone updates reschedule queued reminders without changing product semantics
