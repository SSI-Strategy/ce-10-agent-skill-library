from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.auth import create_token, verify_password
from app.database import get_db
from app.models import LoginRequest, TokenOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=TokenOut,
    summary="Admin login",
    description="Authenticates an admin user and returns a Bearer token valid for 8 hours.",
)
def login(body: LoginRequest) -> TokenOut:
    with get_db() as db:
        row = db.execute(
            "SELECT id, email, password_hash FROM admin_user WHERE email = ?",
            (body.email,),
        ).fetchone()

    if row is None or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return TokenOut(access_token=create_token(row["id"], row["email"]))
