from __future__ import annotations

import hashlib
import hmac
import os
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Secret key — in production this must come from an env var / secret store.
_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
_ALG = "HS256"
_TTL = 8 * 3600  # 8 hours

bearer_scheme = HTTPBearer()


# ── Minimal JWT (header.payload.signature, no external library) ───────────────

def _b64enc(data: bytes) -> str:
    return urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64dec(s: str) -> bytes:
    padding = 4 - len(s) % 4
    return urlsafe_b64decode(s + "=" * padding)


def _sign(msg: str) -> str:
    return _b64enc(hmac.new(_SECRET.encode(), msg.encode(), hashlib.sha256).digest())


def create_token(admin_id: int, email: str) -> str:
    import json

    header = _b64enc(json.dumps({"alg": _ALG, "typ": "JWT"}).encode())
    payload = _b64enc(
        json.dumps({"sub": str(admin_id), "email": email, "exp": int(time.time()) + _TTL}).encode()
    )
    sig = _sign(f"{header}.{payload}")
    return f"{header}.{payload}.{sig}"


def _verify_token(token: str) -> dict:
    import json

    try:
        header, payload, sig = token.split(".")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    expected = _sign(f"{header}.{payload}")
    if not hmac.compare_digest(expected, sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")

    claims = json.loads(_b64dec(payload))
    if claims.get("exp", 0) < time.time():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    return claims


def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    return _verify_token(credentials.credentials)


# ── Password hashing (bcrypt-free, sha256-based for local dev) ────────────────
# The seed data uses fake bcrypt hashes. Real admin accounts should be created
# via a management command that stores proper hashes. For this local dev build
# we accept sha256(password) so the app can be tested without bcrypt installed.

def verify_password(plain: str, stored_hash: str) -> bool:
    # Accept real bcrypt hashes if passlib is available.
    if stored_hash.startswith("$2b$") or stored_hash.startswith("$2a$"):
        try:
            from passlib.context import CryptContext
            ctx = CryptContext(schemes=["bcrypt"])
            return ctx.verify(plain, stored_hash)
        except ImportError:
            # Seed data has fake hashes; always fail gracefully.
            return False
    # Fallback: hex-encoded sha256
    return hmac.compare_digest(
        hashlib.sha256(plain.encode()).hexdigest(),
        stored_hash,
    )


def hash_password(plain: str) -> str:
    try:
        from passlib.context import CryptContext
        return CryptContext(schemes=["bcrypt"]).hash(plain)
    except ImportError:
        return hashlib.sha256(plain.encode()).hexdigest()
