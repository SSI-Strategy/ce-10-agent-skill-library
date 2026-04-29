from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import require_admin
from app.database import get_db
from app.models import OkResponse, TagCreate, TagOut, TagUpdate

router = APIRouter(prefix="/api/tags", tags=["tags"])


def _row_to_tag(row: sqlite3.Row) -> TagOut:
    return TagOut(id=row["id"], name=row["name"], description=row["description"])


@router.get(
    "",
    response_model=list[TagOut],
    summary="List all tags",
    description="Returns every tag in the taxonomy. Used to populate the filter UI.",
)
def list_tags() -> list[TagOut]:
    with get_db() as db:
        rows = db.execute("SELECT id, name, description FROM tag ORDER BY name").fetchall()
    return [_row_to_tag(r) for r in rows]


@router.post(
    "",
    response_model=TagOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a tag (admin)",
    description="Adds a new tag to the taxonomy. Tag names must be unique.",
)
def create_tag(body: TagCreate, _: dict = Depends(require_admin)) -> TagOut:
    with get_db() as db:
        try:
            cur = db.execute(
                "INSERT INTO tag (name, description) VALUES (?, ?) RETURNING id, name, description",
                (body.name, body.description),
            )
            return _row_to_tag(cur.fetchone())
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Tag '{body.name}' already exists")


@router.put(
    "/{tag_id}",
    response_model=TagOut,
    summary="Update a tag (admin)",
    description="Renames a tag or updates its description. The tag must exist.",
)
def update_tag(tag_id: int, body: TagUpdate, _: dict = Depends(require_admin)) -> TagOut:
    with get_db() as db:
        try:
            cur = db.execute(
                "UPDATE tag SET name = ?, description = ? WHERE id = ? RETURNING id, name, description",
                (body.name, body.description, tag_id),
            )
            row = cur.fetchone()
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Tag name '{body.name}' already exists")
    if row is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return _row_to_tag(row)


@router.delete(
    "/{tag_id}",
    response_model=OkResponse,
    summary="Delete a tag (admin)",
    description="Removes a tag from the taxonomy. Fails with 409 if any skill is currently using it.",
)
def delete_tag(tag_id: int, _: dict = Depends(require_admin)) -> OkResponse:
    with get_db() as db:
        row = db.execute("SELECT id FROM tag WHERE id = ?", (tag_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Tag not found")
        try:
            db.execute("DELETE FROM tag WHERE id = ?", (tag_id,))
        except sqlite3.IntegrityError:
            raise HTTPException(
                status_code=409,
                detail="Tag is in use by one or more skills. Reassign those skills first.",
            )
    return OkResponse()
