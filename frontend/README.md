# Frontend — Agent Skill Library

Vite + React + TypeScript.

## Run

```
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to the backend at `:8000`.

## Test

```
npm test
```

## What's here

- `src/App.tsx` — skeleton shell that checks `/api/health` on mount.
- `src/api/client.ts`, `src/api/types.ts` — placeholders. Generate types from the OpenAPI spec in Phase 5.
- `vite.config.ts` — the `/api` proxy.

## What to add

Follow the starter workflow. In short:

1. Phase 5 — generate `src/api/types.ts` from the backend OpenAPI spec, write `client.ts` against those types, then implement one screen per user story.
