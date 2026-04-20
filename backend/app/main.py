"""FastAPI entrypoint for the Agent Skill Library assignment.

This is a skeleton. As you work through the workflow phases, you will add
schema, endpoints, and Pydantic models under this package. The only thing
that ships with the template is a health endpoint and automatic application
of schema.sql on startup when the database file does not exist.
"""
from __future__ import annotations

import sqlite3
from pathlib import Path

from fastapi import FastAPI

BACKEND_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BACKEND_DIR / "app.db"
SCHEMA_PATH = BACKEND_DIR / "schema.sql"
SEED_PATH = BACKEND_DIR / "seed.sql"


def _init_db_if_missing() -> None:
    if DB_PATH.exists():
        return
    if not SCHEMA_PATH.exists():
        return
    schema = SCHEMA_PATH.read_text()
    if not schema.strip():
        return
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(schema)
        if SEED_PATH.exists() and SEED_PATH.read_text().strip():
            conn.executescript(SEED_PATH.read_text())
        conn.commit()
    finally:
        conn.close()


app = FastAPI(
    title="Agent Skill Library",
    description="Capability Engineer starter assignment 10 of 10.",
    version="0.1.0",
)


@app.on_event("startup")
def on_startup() -> None:
    _init_db_if_missing()


@app.get("/api/health", summary="Health check", tags=["health"])
def health() -> dict[str, str]:
    """Return OK if the backend is up. Used by tests and smoke checks."""
    return {"status": "ok"}
