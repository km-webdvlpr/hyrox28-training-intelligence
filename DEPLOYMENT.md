# Cadence Deployment Readiness

## Current persistence model

Cadence is currently a local-first browser app.

What persists today:
- user settings in IndexedDB
- domains, habits, routines, scheduled instances, completions, mood logs, and notifications in IndexedDB
- all data is scoped to one browser profile on one device

What this means in practice:
- a static host is enough to run the app
- no backend is required for the current MVP runtime
- clearing browser storage removes product data
- changing device or browser loses continuity
- there is no account sync, server backup, or cross-device access yet

## What is deploy-ready now

Deploy-ready as-is:
- static frontend hosting
- client-side routing
- local persistence in IndexedDB
- in-app reminder queue behavior
- browser-notification-ready reminder surface when the user has granted permission

Not deploy-ready for a real multi-user live product:
- durable server-side persistence
- authentication
- cross-device sync
- server-driven reminder delivery
- export/import or backup
- migration path from local IndexedDB to server-backed storage

## Recommended deployment target

Recommended first live target:
- GitHub Pages

Why:
- fully free static hosting
- the app is already frontend-only and local-first
- the repo already includes a GitHub Pages build path
- suitable for a serious demo / MVP preview without adding new service dependencies

Good alternatives:
- Vercel
- Netlify
- Cloudflare Pages

Recommendation:
- use GitHub Pages first for the public demo / MVP preview
- keep Vercel, Netlify, or Cloudflare Pages available if deployment ergonomics become more important later
- do not position the hosted app as durable production storage until backend persistence exists

## Build and run commands

Local development:

```bash
npm install
npm run dev
```

Local production preview:

```bash
npm run build
npm run preview
```

Deploy readiness gate:

```bash
npm run test:smoke
```

GitHub Pages build:

```bash
npm run build:pages
```

## Environment configuration

See `.env.example`.

Current variables:
- `VITE_APP_TITLE`
- `VITE_BASE_PATH`

Usage notes:
- leave `VITE_BASE_PATH` empty for local development and root-domain hosting
- set `VITE_BASE_PATH=/cadence/` for the GitHub Pages deployment target

## Live review URL

Expected public review URL for the current Pages target:

`https://km-webdvlpr.github.io/cadence/`

## Runtime risks for a live hosted version

### 1. Local-only persistence

Risk:
- users may assume hosted means account-backed and durable

Impact:
- data loss if storage is cleared or the device changes
- no shared account-level continuity between browsers or devices

Mitigation before real launch:
- add backend persistence
- add auth
- add export/import as a transitional safety net

### 2. Reminder delivery model

Risk:
- reminders are currently queue-based inside the browser app

Impact:
- reminders depend on the app being opened in that browser context
- no guaranteed delivery when the app is closed

Mitigation before real launch:
- introduce a backend notification scheduler
- use Web Push or native mobile push infrastructure

### 3. Timezone dependence

Risk:
- reminder timestamps are regenerated when timezone changes

Current behavior:
- this is working correctly for the MVP and covered by QA

Mitigation before broader launch:
- preserve clearer audit history for timezone changes if users travel frequently

### 4. Browser storage quotas and lifecycle

Risk:
- storage policies vary by browser and device

Mitigation before broader launch:
- add export/import
- surface a clearer persistence disclaimer

## What is needed before a fuller live version

Minimum additions before calling it production:
1. backend database
2. authentication
3. server API around the current entities
4. migration/export path from IndexedDB
5. reliable reminder delivery outside the active browser session
6. deployment monitoring and error capture

These are later upgrades, not blockers for the current GitHub Pages-hosted demo deployment.

## Naming cleanup

Recommended local folder name:
- `Cadence App`

More repository-safe alternative:
- `cadence-execution-intelligence`

Current blocker:
- the workspace folder path still contains `Hyrox App` because an open VS Code process is locking the directory

## Phase 4 note

This phase intentionally does not change product semantics.
It documents deployment implications and adds smoke-test discipline around the existing MVP.
