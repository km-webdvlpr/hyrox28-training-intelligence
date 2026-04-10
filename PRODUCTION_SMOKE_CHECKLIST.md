# Production Smoke Checklist

Run this checklist after any deploy candidate build.

Primary release gate:
- `npm run test:smoke` must pass before any Pages deploy

Primary live review URL:
- `https://km-webdvlpr.github.io/cadence/`

## Pre-flight

- `npm install` completes without dependency errors
- `.env` values match the target host expectations
- `npm run test:smoke` passes locally
- no legacy product naming remains in app-visible surfaces

## Static hosting checks

- app loads without blank screen
- deep links for `/today`, `/habits`, `/routines`, `/review`, `/settings` resolve correctly
- refresh on a routed page does not 404 on the chosen host
- assets load under the configured `VITE_BASE_PATH`

## Core product loop

- onboarding creates the starter habit and lands on Today
- creating a habit materializes future planned instances
- Today renders only active planned items
- `Done` works in one tap for the common binary case
- `Partial`, `Skipped`, and `Moved` still work without required optional fields
- weekly review still reconciles after those flows

## Routines and state logging

- routine creation works
- routine launch works
- action-only routine items can be marked done
- habit-linked routine items can resolve the linked Today habit
- mood/energy can be logged from Today
- weekly review mood/energy section reflects the logged values

## Reminder checks

- a planned instance with a reminder time creates one queued notification
- due reminders surface in Today
- moved instances cancel the original reminder and queue a replacement
- pausing a habit removes active future reminders
- resuming a habit recreates future reminders
- timezone changes reschedule queued reminders correctly

## Settings checks

- timezone updates persist
- logging mode updates persist
- default reminders toggle persists
- custom domain creation works
- custom domain archive is blocked when still in use

## Browser persistence checks

- data survives a tab refresh
- data survives closing and reopening the browser session
- local persistence disclaimer is still accurate in docs

## Release note

Current hosted builds are demo-ready, not production-safe for durable user data, until backend persistence and auth exist.
