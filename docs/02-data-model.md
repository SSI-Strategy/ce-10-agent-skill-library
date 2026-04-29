# Data Model: Agent Skills Catalogue

## Entity: `admin_user`

Stores authenticated admin accounts.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | INTEGER | Yes | Primary key, auto-increment |
| `email` | TEXT | Yes | Unique |
| `password_hash` | TEXT | Yes | bcrypt hash |
| `created_at` | DATETIME | Yes | Defaults to current timestamp |

**Constraints:** `email` must be unique.

---

## Entity: `tag`

The fixed taxonomy of tags. Admins manage this list.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | INTEGER | Yes | Primary key, auto-increment |
| `name` | TEXT | Yes | Unique, e.g. "data-analysis" |
| `description` | TEXT | No | Optional human-readable explanation |
| `created_at` | DATETIME | Yes | Defaults to current timestamp |

**Constraints:** `name` must be unique.

---

## Entity: `skill`

The core catalogue entry.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | INTEGER | Yes | Primary key, auto-increment |
| `name` | TEXT | Yes | Unique |
| `description` | TEXT | Yes | |
| `when_to_trigger` | TEXT | Yes | Conditions under which to use this skill |
| `created_by` | INTEGER | Yes | FK → `admin_user.id` |
| `created_at` | DATETIME | Yes | Defaults to current timestamp |
| `updated_at` | DATETIME | Yes | Updates on every edit |

**Constraints:** `name` must be unique.

**Foreign keys:**
- `created_by → admin_user.id` — records which admin created the skill, for basic auditability.

---

## Entity: `skill_tag`

Join table linking skills to their tags (many-to-many).

| Field | Type | Required | Notes |
|---|---|---|---|
| `skill_id` | INTEGER | Yes | FK → `skill.id` |
| `tag_id` | INTEGER | Yes | FK → `tag.id` |

**Primary key:** composite `(skill_id, tag_id)`.

**Foreign keys:**
- `skill_id → skill.id` — identifies which skill this tag assignment belongs to; row is deleted if the skill is deleted (CASCADE).
- `tag_id → tag.id` — identifies which tag from the taxonomy is applied; deletion of a tag is blocked if any skill uses it (RESTRICT).

---

## Entity: `example_prompt`

Multiple labelled prompts per skill.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | INTEGER | Yes | Primary key, auto-increment |
| `skill_id` | INTEGER | Yes | FK → `skill.id` |
| `label` | TEXT | Yes | Short title for this prompt, e.g. "Summarise a meeting" |
| `prompt_text` | TEXT | Yes | The full prompt content |
| `sort_order` | INTEGER | No | Controls display order within a skill |

**Foreign keys:**
- `skill_id → skill.id` — binds each prompt to its parent skill; prompts are deleted when the skill is deleted (CASCADE).

---

## Relationship Summary

```
admin_user ──< skill (created_by)
skill >──< tag  (via skill_tag)
skill ──< example_prompt
```

---

## Ambiguities Resolved

| Ambiguity | Decision | Reason |
|---|---|---|
| Should skills have a soft-delete or hard-delete? | Hard-delete for now | No archiving requirement was mentioned; keeps the model simple. Can add an `is_archived` flag later. |
| Should tag deletion be blocked or cascade? | RESTRICT (blocked if in use) | Deleting a tag silently would corrupt the taxonomy; admins should reassign skills first. |
| Should `created_by` be nullable? | No — required | Every skill is created by an admin, so there is always a known author. If an admin account is later deleted, the FK should SET NULL — noted as a future decision. |
| Is `label` required on example prompts? | Yes | Without a label the side panel has no way to distinguish between multiple prompts; an unlabelled prompt is not meaningful to the user. |
| Is `skill.name` unique? | Yes | Duplicate skill names would confuse users browsing the catalogue. |
| Should `updated_at` be tracked? | Yes, on `skill` only | Skills are the only entity likely to be edited over time; prompts and tags are replaced, not revised in place. |
