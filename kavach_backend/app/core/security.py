import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.models.schemas import UserPayload


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def create_access_token(user_id: UUID | str, role: str) -> tuple[str, datetime]:
    expires_at = _now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MIN)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": _now(),
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, expires_at


def create_refresh_token() -> tuple[str, str, datetime]:
    raw = secrets.token_hex(64)
    token_hash = _sha256(raw)
    expires_at = _now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return raw, token_hash, expires_at


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    if payload.get("type") != "access":
        raise JWTError("Token is not an access token.")
    return payload


def create_reset_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(48)
    return raw, _sha256(raw)


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def hash_token(raw: str) -> str:
    return _sha256(raw)


# Backward compatibility for existing v1 detection routes.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserPayload:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        role_raw = str(payload.get("role") or "")
        role_map = {
            "farm_owner": "Farm Owner",
            "veterinarian": "Veterinarian",
            "authority": "Authority",
        }
        return UserPayload(
            user_id=str(payload.get("sub") or ""),
            farm_id=str(payload.get("farm_id") or "test_farm"),
            role=role_map.get(role_raw, role_raw or "Veterinarian"),
        )
    except Exception:
        raise credentials_exception
