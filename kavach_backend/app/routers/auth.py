from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.auth import AuthAuditLog, PasswordResetToken, RefreshToken, User, UserCredentials
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    UpdateProfileRequest,
    UserProfileResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


async def _audit(
    db: AsyncSession,
    event_type: str,
    success: bool,
    user_id: UUID | None = None,
    request: Request | None = None,
    metadata: dict | None = None,
):
    log = AuthAuditLog(
        user_id=user_id,
        event_type=event_type,
        success=success,
        ip_address=_client_ip(request) if request else None,
        user_agent=request.headers.get("user-agent") if request else None,
        metadata_json=metadata,
    )
    db.add(log)


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, request: Request, db: DbDep):
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        full_name=body.full_name.strip(),
        email=body.email.lower(),
        phone_number=body.phone_number,
        date_of_birth=body.date_of_birth,
        role=body.role,
        street_address=body.street_address,
        city=body.city,
        state=body.state,
        postal_code=body.postal_code,
        country=body.country,
    )
    db.add(user)
    await db.flush()

    creds = UserCredentials(user_id=user.id, password_hash=hash_password(body.password))
    db.add(creds)

    await _audit(db, "register", True, user.id, request)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request, db: DbDep):
    result = await db.execute(
        select(User).options(selectinload(User.credentials)).where(User.email == body.email.lower())
    )
    user: User | None = result.scalar_one_or_none()

    def _invalid_credentials_error() -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user or not user.is_active:
        await _audit(
            db,
            "login_failed",
            False,
            None,
            request,
            {"reason": "user_not_found_or_inactive", "email": body.email},
        )
        raise _invalid_credentials_error()

    creds = user.credentials
    if not creds:
        await _audit(db, "login_failed", False, user.id, request, {"reason": "missing_credentials"})
        raise _invalid_credentials_error()

    if creds.locked_until and creds.locked_until > _now():
        remaining = int((creds.locked_until - _now()).total_seconds() // 60) + 1
        await _audit(db, "login_failed", False, user.id, request, {"reason": "account_locked"})
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked. Try again in {remaining} minute(s).",
        )

    if not verify_password(body.password, creds.password_hash):
        creds.failed_attempts += 1
        if creds.failed_attempts >= settings.MAX_FAILED_ATTEMPTS:
            creds.locked_until = _now() + timedelta(minutes=settings.LOCKOUT_DURATION_MIN)
            await _audit(
                db,
                "account_locked",
                False,
                user.id,
                request,
                {"failed_attempts": creds.failed_attempts},
            )
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=(
                    "Too many failed attempts. Account locked for "
                    f"{settings.LOCKOUT_DURATION_MIN} minutes."
                ),
            )

        await _audit(
            db,
            "login_failed",
            False,
            user.id,
            request,
            {"failed_attempts": creds.failed_attempts},
        )
        raise _invalid_credentials_error()

    creds.failed_attempts = 0
    creds.locked_until = None

    access_token, _ = create_access_token(user.id, user.role)
    raw_refresh, refresh_hash, refresh_expires = create_refresh_token()

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=refresh_expires,
            device_info=request.headers.get("user-agent", "")[:255],
            ip_address=_client_ip(request),
        )
    )

    await _audit(db, "login", True, user.id, request)

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MIN * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(body: RefreshRequest, request: Request, db: DbDep):
    token_hash = hash_token(body.refresh_token)

    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    stored: RefreshToken | None = result.scalar_one_or_none()

    if not stored or stored.revoked_at or stored.expires_at < _now():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or expired.",
        )

    result = await db.execute(select(User).where(User.id == stored.user_id))
    user: User | None = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated.",
        )

    stored.revoked_at = _now()

    access_token, _ = create_access_token(user.id, user.role)
    raw_refresh, refresh_hash, refresh_expires = create_refresh_token()

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=refresh_expires,
            device_info=request.headers.get("user-agent", "")[:255],
            ip_address=_client_ip(request),
        )
    )

    await _audit(db, "refresh", True, user.id, request)

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MIN * 60,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(body: RefreshRequest, request: Request, db: DbDep, user: CurrentUser):
    token_hash = hash_token(body.refresh_token)

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == user.id,
        )
    )
    stored: RefreshToken | None = result.scalar_one_or_none()

    if stored and not stored.revoked_at:
        stored.revoked_at = _now()

    await _audit(db, "logout", True, user.id, request)


@router.get("/me", response_model=UserProfileResponse)
async def me(user: CurrentUser):
    return user


@router.patch("/me", response_model=UserProfileResponse)
async def update_me(body: UpdateProfileRequest, request: Request, db: DbDep, user: CurrentUser):
    updates = body.model_dump(exclude_unset=True)

    if not updates:
        return user

    for field_name, field_value in updates.items():
        setattr(user, field_name, field_value)

    db.add(user)
    await db.flush()
    await db.refresh(user)

    await _audit(db, "profile_update", True, user.id, request, {"fields": list(updates.keys())})

    return user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(body: ForgotPasswordRequest, request: Request, db: DbDep):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user: User | None = result.scalar_one_or_none()

    if user and user.is_active:
        raw_token, token_hash = create_reset_token()
        expires_at = _now() + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MIN)

        existing = await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used_at == None,
            )
        )
        for old in existing.scalars().all():
            old.used_at = _now()

        db.add(PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))

        await _audit(db, "password_reset_request", True, user.id, request)

        if settings.DEBUG:
            print(f"[DEV] Reset token for {user.email}: {raw_token}")

    return ForgotPasswordResponse()


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(body: ResetPasswordRequest, request: Request, db: DbDep):
    token_hash = hash_token(body.token)

    result = await db.execute(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash))
    prt: PasswordResetToken | None = result.scalar_one_or_none()

    if not prt or prt.used_at or prt.expires_at < _now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token is invalid or has expired.",
        )

    result = await db.execute(select(UserCredentials).where(UserCredentials.user_id == prt.user_id))
    creds: UserCredentials | None = result.scalar_one_or_none()
    if not creds:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credentials not found.")

    creds.password_hash = hash_password(body.new_password)
    creds.password_updated_at = _now()
    creds.failed_attempts = 0
    creds.locked_until = None

    prt.used_at = _now()

    existing_sessions = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == prt.user_id,
            RefreshToken.revoked_at == None,
        )
    )
    for sess in existing_sessions.scalars().all():
        sess.revoked_at = _now()

    await _audit(db, "password_reset", True, prt.user_id, request)

    return ResetPasswordResponse()
