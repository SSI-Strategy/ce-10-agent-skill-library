PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── admin_user ────────────────────────────────────────────────────────────────
CREATE TABLE admin_user (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    email         TEXT     NOT NULL UNIQUE,
    password_hash TEXT     NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- ── tag ───────────────────────────────────────────────────────────────────────
CREATE TABLE tag (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    name        TEXT     NOT NULL UNIQUE,
    description TEXT,
    created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- ── skill ─────────────────────────────────────────────────────────────────────
CREATE TABLE skill (
    id              INTEGER  PRIMARY KEY AUTOINCREMENT,
    name            TEXT     NOT NULL UNIQUE,
    description     TEXT     NOT NULL,
    when_to_trigger TEXT     NOT NULL,
    created_by      INTEGER  NOT NULL REFERENCES admin_user(id) ON DELETE RESTRICT,
    created_at      DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at      DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- ── skill_tag (join table) ────────────────────────────────────────────────────
CREATE TABLE skill_tag (
    skill_id INTEGER NOT NULL REFERENCES skill(id)     ON DELETE CASCADE,
    tag_id   INTEGER NOT NULL REFERENCES tag(id)       ON DELETE RESTRICT,
    PRIMARY KEY (skill_id, tag_id)
);

-- ── example_prompt ────────────────────────────────────────────────────────────
CREATE TABLE example_prompt (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id   INTEGER NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    label      TEXT    NOT NULL,
    prompt_text TEXT   NOT NULL,
    sort_order INTEGER,
    CHECK (length(label) > 0),
    CHECK (length(prompt_text) > 0)
);

-- ── trigger: keep updated_at current on skill edits ──────────────────────────
CREATE TRIGGER skill_updated_at
AFTER UPDATE ON skill
FOR EACH ROW
BEGIN
    UPDATE skill SET updated_at = datetime('now') WHERE id = OLD.id;
END;
