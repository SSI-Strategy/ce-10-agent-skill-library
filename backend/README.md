# Backend — Agent Skill Library

FastAPI + SQLite, managed by [uv](https://docs.astral.sh/uv/).

## Run

```
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

OpenAPI docs: http://localhost:8000/docs

## Test

```
uv run pytest
```

## What's here

- `app/main.py` — FastAPI entrypoint with `GET /api/health`.
- `schema.sql` — your database schema (empty; you fill this in Phase 3).
- `seed.sql` — your seed data (empty; you fill this in Phase 3).
- `tests/` — pytest tests; the skeleton ships with a single health-check test.

## What to add

Follow the starter workflow. In short:

1. Phase 2 — design the data model in `../docs/02-data-model.md`.
2. Phase 3 — fill `schema.sql` and `seed.sql` from that model.
3. Phase 4 — add Pydantic models and routes under `app/`. All routes prefixed `/api`.

Do not edit the schema outside of `schema.sql`. The source of truth is the model document one step up.
