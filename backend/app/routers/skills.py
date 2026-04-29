from __future__ import annotations

import sqlite3
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import require_admin
from app.database import get_db
from app.models import (
    ExamplePromptOut,
    OkResponse,
    SkillDetail,
    SkillSummary,
    SkillWrite,
    TagOut,
)

router = APIRouter(prefix="/api/skills", tags=["skills"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _tags_for(db: sqlite3.Connection, skill_id: int) -> list[TagOut]:
    rows = db.execute(
        """
        SELECT t.id, t.name, t.description
        FROM tag t
        JOIN skill_tag st ON st.tag_id = t.id
        WHERE st.skill_id = ?
        ORDER BY t.name
        """,
        (skill_id,),
    ).fetchall()
    return [TagOut(id=r["id"], name=r["name"], description=r["description"]) for r in rows]


def _prompts_for(db: sqlite3.Connection, skill_id: int) -> list[ExamplePromptOut]:
    rows = db.execute(
        """
        SELECT id, label, prompt_text, sort_order
        FROM example_prompt
        WHERE skill_id = ?
        ORDER BY COALESCE(sort_order, 9999), id
        """,
        (skill_id,),
    ).fetchall()
    return [
        ExamplePromptOut(
            id=r["id"],
            label=r["label"],
            prompt_text=r["prompt_text"],
            sort_order=r["sort_order"],
        )
        for r in rows
    ]


def _write_skill_relations(db: sqlite3.Connection, skill_id: int, body: SkillWrite) -> None:
    """Replace tags and example_prompts for a skill (used by both create and update)."""
    db.execute("DELETE FROM skill_tag WHERE skill_id = ?", (skill_id,))
    db.execute("DELETE FROM example_prompt WHERE skill_id = ?", (skill_id,))

    for tag_id in body.tag_ids:
        exists = db.execute("SELECT 1 FROM tag WHERE id = ?", (tag_id,)).fetchone()
        if not exists:
            raise HTTPException(status_code=422, detail=f"Tag id {tag_id} does not exist")
        db.execute(
            "INSERT INTO skill_tag (skill_id, tag_id) VALUES (?, ?)",
            (skill_id, tag_id),
        )

    for prompt in body.example_prompts:
        db.execute(
            "INSERT INTO example_prompt (skill_id, label, prompt_text, sort_order) VALUES (?, ?, ?, ?)",
            (skill_id, prompt.label, prompt.prompt_text, prompt.sort_order),
        )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=list[SkillSummary],
    summary="Search and filter skills",
    description=(
        "Returns skill summaries (id, name, description, tags). "
        "Pass `q` to search across name, description, and tag names. "
        "Pass `tag` one or more times to filter to skills that have **all** of those tags (AND logic)."
    ),
)
def list_skills(
    q: Annotated[str | None, Query(description="Keyword search across name, description, and tags")] = None,
    tag: Annotated[list[int] | None, Query(description="Tag IDs to filter by (AND logic)")] = None,
) -> list[SkillSummary]:
    with get_db() as db:
        # Base query — fetch all skills, then filter in Python to keep SQL simple.
        rows = db.execute(
            "SELECT id, name, description FROM skill ORDER BY name"
        ).fetchall()

        results: list[SkillSummary] = []
        for row in rows:
            skill_id = row["id"]
            tags = _tags_for(db, skill_id)
            tag_names = {t.name.lower() for t in tags}
            tag_ids_set = {t.id for t in tags}

            if tag and not set(tag).issubset(tag_ids_set):
                continue

            if q:
                needle = q.lower()
                if (
                    needle not in row["name"].lower()
                    and needle not in row["description"].lower()
                    and not any(needle in tn for tn in tag_names)
                ):
                    continue

            results.append(
                SkillSummary(
                    id=skill_id,
                    name=row["name"],
                    description=row["description"],
                    tags=tags,
                )
            )

    return results


@router.get(
    "/{skill_id}",
    response_model=SkillDetail,
    summary="Get full skill detail",
    description="Returns the complete skill record including when-to-trigger and all example prompts. Used to populate the side panel.",
)
def get_skill(skill_id: int) -> SkillDetail:
    with get_db() as db:
        row = db.execute(
            "SELECT id, name, description, when_to_trigger, created_at, updated_at FROM skill WHERE id = ?",
            (skill_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Skill not found")

        return SkillDetail(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            when_to_trigger=row["when_to_trigger"],
            tags=_tags_for(db, skill_id),
            example_prompts=_prompts_for(db, skill_id),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


@router.post(
    "",
    response_model=SkillDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create a skill (admin)",
    description="Creates a new skill with its tags and example prompts. All tag IDs must exist in the taxonomy.",
)
def create_skill(body: SkillWrite, admin: dict = Depends(require_admin)) -> SkillDetail:
    with get_db() as db:
        try:
            cur = db.execute(
                """
                INSERT INTO skill (name, description, when_to_trigger, created_by)
                VALUES (?, ?, ?, ?)
                RETURNING id, name, description, when_to_trigger, created_at, updated_at
                """,
                (body.name, body.description, body.when_to_trigger, int(admin["sub"])),
            )
            row = cur.fetchone()
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Skill '{body.name}' already exists")

        skill_id = row["id"]
        _write_skill_relations(db, skill_id, body)

        return SkillDetail(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            when_to_trigger=row["when_to_trigger"],
            tags=_tags_for(db, skill_id),
            example_prompts=_prompts_for(db, skill_id),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


@router.put(
    "/{skill_id}",
    response_model=SkillDetail,
    summary="Update a skill (admin)",
    description="Replaces all fields, tags, and example prompts for an existing skill.",
)
def update_skill(skill_id: int, body: SkillWrite, _: dict = Depends(require_admin)) -> SkillDetail:
    with get_db() as db:
        try:
            cur = db.execute(
                """
                UPDATE skill
                SET name = ?, description = ?, when_to_trigger = ?
                WHERE id = ?
                RETURNING id, name, description, when_to_trigger, created_at, updated_at
                """,
                (body.name, body.description, body.when_to_trigger, skill_id),
            )
            row = cur.fetchone()
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Skill name '{body.name}' already exists")

        if row is None:
            raise HTTPException(status_code=404, detail="Skill not found")

        _write_skill_relations(db, skill_id, body)

        return SkillDetail(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            when_to_trigger=row["when_to_trigger"],
            tags=_tags_for(db, skill_id),
            example_prompts=_prompts_for(db, skill_id),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


@router.delete(
    "/{skill_id}",
    response_model=OkResponse,
    summary="Delete a skill (admin)",
    description="Permanently deletes a skill and all its tags and example prompts.",
)
def delete_skill(skill_id: int, _: dict = Depends(require_admin)) -> OkResponse:
    with get_db() as db:
        row = db.execute("SELECT id FROM skill WHERE id = ?", (skill_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Skill not found")
        db.execute("DELETE FROM skill WHERE id = ?", (skill_id,))
    return OkResponse()
