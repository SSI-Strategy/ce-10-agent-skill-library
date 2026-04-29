from __future__ import annotations

import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI

from app.routers import auth, skills, tags

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


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    _init_db_if_missing()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Agent Skill Library",
    description=(
        "Internal catalogue of Claude agent skills. "
        "Regular users can search and browse without authentication. "
        "Admin endpoints require a Bearer token from POST /api/auth/login."
    ),
    version="0.1.0",
)

app.include_router(auth.router)
app.include_router(skills.router)
app.include_router(tags.router)


@app.get("/api/health", summary="Health check", tags=["health"])
def health() -> dict[str, str]:
    """Return OK if the backend is up."""
    return {"status": "ok"}
