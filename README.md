# Hyrox28 Training Intelligence

Local-first Hyrox performance tracking and analytics built with React, TypeScript, Vite, Tailwind CSS, Recharts, and IndexedDB.

## What it is

Hyrox28 Training Intelligence is a single-user training log and analytics app for Hyrox-style programming. It opens straight to the dashboard, runs without authentication, and stores data in the browser with IndexedDB instead of Supabase.

The visual direction is intentionally bright and high-contrast:
- warm paper background
- carbon black surfaces and typography
- signal yellow accents
- mono labels with a race-ops / telemetry feel

## Core features

- Dashboard with KPI cards and six trend charts
- Dynamic workout log form using `react-hook-form` and `zod`
- Conditional exercise inputs by movement category
- Filterable workout history
- Deep-dive analytics page with time-window controls
- Realistic 10-week seeded dataset on first load
- GitHub Pages deployment workflow included

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router v6
- React Hook Form
- Zod
- date-fns
- Recharts
- clsx + tailwind-merge
- idb

## Data storage

The app uses IndexedDB through `idb`.

- No backend required
- No API keys required
- No auth required
- Data persists in the browser on the current device

Important:
- seeded demo data is created automatically when the database is empty
- browser storage clearing will remove local data
- this version does not sync across devices

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Quality checks

```bash
npm run lint
npm run build
```

Or run both:

```bash
npm run check
```

## GitHub Pages deploy

This repo is set up for branch-based GitHub Pages publishing from `main` -> `/docs`.

To refresh the published site:

```bash
npm install
npm run build:pages
git add docs
git commit -m "Update GitHub Pages build"
git push
```

Then make sure the repository Pages source is:

1. `Deploy from a branch`
2. Branch: `main`
3. Folder: `/docs`

## GitHub Pages routing

The build includes:

- `docs/404.html` for SPA deep-link recovery
- `docs/.nojekyll` so GitHub Pages serves the static files directly without Jekyll

## Project structure

```text
.
├─ public/favicon.svg
├─ public/404.html
├─ public/.nojekyll
├─ src/
│  ├─ components/
│  ├─ context/
│  ├─ data/
│  ├─ hooks/
│  ├─ lib/
│  ├─ pages/
│  ├─ types/
│  ├─ App.tsx
│  ├─ index.css
│  └─ main.tsx
├─ .env.example
├─ Fitness.txt
├─ index.html
└─ package.json
```

## Main data files

- `src/data/db.ts`: IndexedDB setup and persistence helpers
- `src/data/seed.ts`: realistic seeded workout and exercise data
- `src/lib/analytics.ts`: workout summaries, weekly trends, adherence logic, and chart-ready transforms
- `src/components/workout-form.tsx`: dynamic logging form

## If you want cloud sync later

The clean extension point is `src/data/db.ts`.

That lets you keep the current UI and analytics layer while swapping the persistence implementation later for something like Turso or Cloudflare D1 behind a protected API.
