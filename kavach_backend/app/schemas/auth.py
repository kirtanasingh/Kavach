import re
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


VALID_ROLES = {"farm_owner"}
PASSWORD_MIN = 8
PASSWORD_MAX = 128

_phone_re = re.compile(r"^\+?[1-9]\d{6,14}$")


def _validate_password_strength(v: str) -> str:
    if len(v) < PASSWORD_MIN:
        raise ValueError(f"Password must be at least {PASSWORD_MIN} characters.")
    if len(v) > PASSWORD_MAX:
        raise ValueError(f"Password must not exceed {PASSWORD_MAX} characters.")
    if not re.search(r"[A-Z]", v):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", v):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", v):
        raise ValueError("Password must contain at least one digit.")
    if not re.search(r"[^A-Za-z0-9]", v):
        raise ValueError("Password must contain at least one special character (!@#$… etc.).")
    return v


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    role: str
    street_address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: str = Field("India", max_length=100)
    password: str
    agreed_to_terms: bool

    @field_validator("full_name")
    @classmethod
    def name_no_digits(cls, v: str) -> str:
        v = v.strip()
        if re.search(r"\d", v):
            raise ValueError("Full name must not contain numbers.")
        return v

    @field_validator("phone_number")
    @classmethod
    def phone_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not _phone_re.match(v):
            raise ValueError("Phone number must be in E.164 format, e.g. +919876543210")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def must_be_adult(cls, v: Optional[date]) -> Optional[date]:
        if v is None:
            return v
        from datetime import date as dt_date

        today = dt_date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError("You must be at least 18 years old to register.")
        if age > 120:
            raise ValueError("Invalid date of birth.")
        return v

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v: str) -> str:
        if v not in VALID_ROLES:
            raise ValueError("Public registration supports only farm_owner role.")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)

    @field_validator("agreed_to_terms")
    @classmethod
    def must_agree(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must agree to the terms and conditions.")
        return v


class RegisterResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=PASSWORD_MAX)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class UserProfileResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone_number: Optional[str]
    date_of_birth: Optional[date]
    role: str
    street_address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    postal_code: Optional[str]
    country: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone_number: Optional[str] = None
    street_address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)

    @field_validator("full_name")
    @classmethod
    def name_no_digits(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if re.search(r"\d", v):
            raise ValueError("Full name must not contain numbers.")
        return v

    @field_validator("phone_number")
    @classmethod
    def phone_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        if not _phone_re.match(v):
            raise ValueError("Phone number must be in E.164 format, e.g. +919876543210")
        return v

    @field_validator("street_address", "city", "state", "postal_code")
    @classmethod
    def normalize_text_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        value = v.strip()
        return value or None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str = "If that email is registered, a reset link has been sent."


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class ResetPasswordResponse(BaseModel):
    message: str = "Password has been reset. Please log in with your new password."


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str


class ErrorResponse(BaseModel):
    detail: list[ErrorDetail]
