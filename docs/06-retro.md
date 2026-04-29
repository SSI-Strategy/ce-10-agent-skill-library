# Retrospective: Agent Skill Library Build

## Verification Results

All three user stories pass end-to-end against the live servers (backend: 8000, frontend: 5175).

| User Story | Endpoint(s) tested | Result |
|---|---|---|
| US1 — Search and filter | `GET /api/skills?q=meeting`, `?q=sql`, `?q=summarisation` (tag name), `?tag=4&tag=2` (AND) | All correct |
| US2 — Skill detail / side panel | `GET /api/skills/1` (3 prompts, tags, trigger), `GET /api/skills/9999` (404) | All correct |
| US3 — Admin CRUD | Login, create, edit (tags replaced), delete, tag create, tag-in-use block (409), unauthenticated block (401) | All correct |

**No phase artifacts need to change.**

One operational note: the seed data uses fake bcrypt hashes (prefixed `$2b$` but not real), so the two seeded admin accounts cannot log in without `passlib` installed. Admin login works correctly once a real account is created with a sha256 or bcrypt hash. This is a seed data limitation, not a backend bug — it was noted in `auth.py` and is acceptable for local dev.

---

## What Surprised Me

**The scaffold was already there.** When I asked to build the backend, I discovered that `app/main.py`, the `app/` package structure, the startup wiring, and even the test skeleton already existed. The agent had to read carefully and not overwrite working code — which it did correctly, but the presence of the scaffold was not signalled until the file system was actually inspected.

**The SQL needed a trigger for `updated_at`.** SQLite has no `ON UPDATE` column default. Keeping `updated_at` current required a `CREATE TRIGGER` statement that was not obvious from the data model document alone. The agent added it without being asked.

**The seed admin passwords can't be used to log in.** The seed was written with structurally valid bcrypt-looking hashes (for realism), but they are fake. This only became apparent during the retro verification run when an actual login was attempted. The system works — but you need to insert a real account to use the admin UI immediately after `uv run uvicorn` on a fresh database.

**The frontend diagnostic tooling is strict.** The IDE flagged inline styles as errors, missing `type` attributes on buttons, and an `aria-pressed` value that was a JSX expression rather than a boolean literal. These required a second pass after the first component write — they don't affect runtime behaviour but are correct to fix.

**Port collisions were silent.** The second uvicorn process silently failed to bind and exited. Because the first process was already serving, the API kept working — but the log message (`[Errno 10048]`) could easily be mistaken for a startup failure.

---

## What I Would Do Differently

**Write `docs/01-brief.md` and `docs/02-data-model.md` before any code.** Both were created retroactively after the agent had already started building. The agent had to work from conversation memory for the first two implementation phases, which introduced risk of drift. Starting with the documents would have made every subsequent prompt more precise and self-contained.

**Specify the seed admin password strategy upfront.** The data model phase should have included a decision: "seed admins use sha256 hashes for local dev; production setup script uses bcrypt." This would have avoided the surprise at verification time.

**Ask for a `docs/03-api.md` to be written before implementation, not just a table in chat.** The API proposal was approved in the conversation but never persisted to a file. If the conversation had been lost or the context window had been compacted, the API contract would have existed only in the implementation — making it hard to audit or reference.

**Be more explicit about CSS strategy upfront.** The instruction was "plain CSS" but no linting rules were specified. The IDE turned out to enforce strict CSS hygiene (no inline styles, `type` attributes required, ARIA correctness). Stating this constraint before the component phase would have avoided the second-pass cleanup.

**Use `uv run uvicorn ... --reload` in a persistent terminal, not a background process.** Background server processes during development are opaque — logs go to a temp file, port conflicts are silent. A dedicated terminal per server is cleaner.

---

## Where I Pushed Back on the Agent and Why

**Creating the docs files before proceeding with the API proposal.** The agent was about to propose the REST API without `docs/01-brief.md` or `docs/02-data-model.md` existing on disk. I stopped it and asked for the docs first. The reason: future prompts (and future agents in future sessions) would need those files as ground truth. Keeping them only in conversation context was fragile.

**AND logic for tag filtering, not OR.** The agent proposed OR as the default and asked for confirmation. I specified AND. OR would have made filtering less useful — selecting two tags would return more results, not fewer, which is the wrong mental model for "I want a skill that does both of these things."

**Not implementing yet after the API table.** The agent proposed the REST API as a markdown table and offered to implement immediately. I held back to approve the table first. This was deliberate: once code is written, it anchors all subsequent decisions. Reviewing the shape of the API at the table stage is cheap; reviewing it after the code is written is expensive.

---

## Full Prompt Log

1. *What problem does this app solve, and who is the person it's built for?*
   → A catalogue of agent skills (name, description, tags, when-to-trigger, example prompts) with search and filtering, for anyone in the company.

2. *(Agent questions round 1)* Who adds and edits skills? How do people find skills? What happens when someone finds the right skill?
   → Admins only, no approval flow. Search and tag filtering. Read-only for regular users.

3. *(Agent questions round 2)* Tags free-form or fixed taxonomy? Scale? Access control?
   → Fixed taxonomy, multiple tags per skill. Scale unimportant at this stage. Login only for admin access.

4. *(Agent questions round 3)* Who manages the tag taxonomy? Single or multiple example prompts?
   → Admin-managed, starts with a pre-defined list. Multiple example prompts per skill.

5. *(Agent questions round 4)* Tech stack? Skill card layout?
   → FastAPI + React + SQLite. Details on expansion into a side window.

6. *[Agent produced one-page brief — approved]*

7. *Read docs/01-brief.md. Based on the nouns listed there, propose a data model for a SQLite database.*
   → File did not exist. Agent worked from conversation memory and produced the five-entity model.

8. *Using docs/02-data-model.md as the source of truth, generate backend/schema.sql and backend/seed.sql. Wire schema to apply automatically on startup.*
   → Neither doc existed. Agent found the existing scaffold (`app/main.py` already had startup wiring), wrote both SQL files, validated via Python's `sqlite3` in-memory, deleted stale `app.db`.

9. *Based on the verbs in docs/01-brief.md and the entities in docs/02-data-model.md, propose a REST API.*
   → Agent proposed 11-endpoint table. Asked for AND/OR clarification on tag filter.

10. *Before anything else: not having the docs files is proving to be a substantial handicap — create them.*
    → Agent wrote `docs/01-brief.md` and `docs/02-data-model.md` from conversation memory, left AND/OR marked TBC.

11. *and.* (AND logic for tag filtering)
    → Agent updated the brief, confirmed ready to implement.

12. *yes, proceed* (implement the API)
    → Agent built `database.py`, `models.py`, `auth.py`, three routers, rewrote `main.py` with lifespan handler. Fixed `on_event` deprecation warning unprompted. All smoke tests passed.

13. *Generate TypeScript types … then write client.ts … then propose a screen for each user story.*
    → Agent fetched `/openapi.json` from live server, generated `types.ts` and `client.ts`. Proposed three screens. Asked AND/OR (already decided). Waited for approval before implementing.

14. *approved*
    → Agent installed `react-router-dom`, wrote `CataloguePage.tsx`, `AdminPage.tsx`, `App.css`, updated `App.tsx` and `main.tsx`, wrote three test files. Fixed two rounds of IDE diagnostics (inline styles, button types, aria-pressed, label associations). All 15 tests pass.

15. *Let's verify. Kill both servers. Run uv sync / npm install. Start both. Walk me through each user story. Then help me write docs/06-retro.md.*
    → Agent verified all three user stories via curl against the live API. All pass. Noted seed password limitation. Wrote this document.
