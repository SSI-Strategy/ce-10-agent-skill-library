# App Brief: Agent Skills Catalogue

## The User

Two distinct personas:

- **Regular user** — any company employee. No login required. Browses, searches, and reads skills.
- **Admin** — authenticated superuser. Manages the catalogue: creates, edits, and deletes skills and manages the tag taxonomy.

---

## Three Core User Stories

1. **As a regular user**, I want to search and filter the skills catalogue by keyword and tag so that I can quickly find the right skill for my task.
2. **As a regular user**, I want to expand a skill card into a side panel so that I can read its full details — description, trigger conditions, and example prompts — without losing context of the list.
3. **As an admin**, I want to create, edit, and delete skills (and manage the tag taxonomy) behind a login so that the catalogue stays accurate and tag consistency is enforced.

---

## Key Nouns (things the app tracks)

| Noun | Notes |
|---|---|
| **Skill** | Name, description, tags, when-to-trigger, example prompts |
| **Example Prompt** | Multiple per skill, each a distinct labelled entry |
| **Tag** | Drawn from a fixed, admin-managed taxonomy |
| **User / Admin** | Two roles; only admins authenticate |

---

## Key Verbs (things users can do)

| Verb | Who |
|---|---|
| Search skills (keyword — searches name, description, and tags) | Everyone |
| Filter skills by tag | Everyone |
| Expand a skill into a side panel | Everyone |
| Create / edit / delete a skill | Admin |
| Add / remove / edit tags in the taxonomy | Admin |
| Log in / log out | Admin |

---

## Constraints and Decisions

- **Stack:** FastAPI + React + SQLite
- **Tag taxonomy:** pre-defined at launch, grows over time under admin control only; free-form tags are not allowed
- **Read-only for regular users:** no ratings, comments, or submissions
- **Skill list view:** shows name, description, and tags only — full detail revealed on expansion into a side panel
- **Search:** keyword search covers name, description, and tag names simultaneously
- **Tag filtering:** a skill must have all of the selected tags (AND logic)
- **Scale:** starts small, designed to scale without constraint
