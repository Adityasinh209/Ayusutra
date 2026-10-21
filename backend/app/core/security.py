import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.entities import User

bearer = HTTPBearer(auto_error=False)
_jwks: PyJWKClient | None = None


def _jwks_client() -> PyJWKClient | None:
    global _jwks
    if not settings.clerk_frontend_api:
        return None
    if _jwks is None:
        _jwks = PyJWKClient(f"https://{settings.clerk_frontend_api}/.well-known/jwks.json")
    return _jwks


def token_claims(token: str) -> dict:
    if settings.allow_test_tokens and token.startswith("test:"):
        user_id = token.split(":", 1)[1]
        return {"sub": user_id, "test_user_id": user_id}
    client = _jwks_client()
    if client is None:
        raise HTTPException(status_code=401, detail="Auth is not configured.")
    try:
        key = client.get_signing_key_from_jwt(token)
        return jwt.decode(token, key.key, algorithms=["RS256"], options={"verify_aud": False})
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token.") from exc


def user_from_claims(db: Session, claims: dict) -> User:
    if claims.get("test_user_id"):
        user = db.get(User, claims["test_user_id"])
        if user is None:
            raise HTTPException(status_code=401, detail="Unknown user.")
        return user
    sub = claims.get("sub") or ""
    email = (claims.get("email") or claims.get("primary_email") or "").lower()
    user = db.query(User).filter(User.clerk_id == sub).one_or_none()
    if user is None and email:
        user = db.query(User).filter(User.email == email).one_or_none()
        if user is not None and not user.clerk_id:
            user.clerk_id = sub
            db.commit()
    if user is None:
        user = User(
            id=sub,
            clerk_id=sub,
            email=email or f"{sub}@users.clerk",
            name=claims.get("name") or "Guest",
            role="patient",
            role_label="Patient",
            active=1,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    if not user.active:
        raise HTTPException(status_code=401, detail="Inactive user.")
    return user


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(status_code=401, detail="Missing token.")
    return user_from_claims(db, token_claims(creds.credentials))


def require_roles(*roles: str):
    def _dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Not allowed.")
        return user
    return _dep
