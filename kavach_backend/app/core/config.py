from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Existing service settings
    groq_api_key: str = ""
    app_name: str = "Kavach Animal Disease Detection Microservice"
    debug: bool = False
    upload_dir: str = "uploads"
    max_image_size_mb: int = 10
    api_v1_str: str = "/api/v1"
    secret_key: str = ""
    algorithm: str = "HS256"
    redis_url: str = "redis://localhost:6379/0"
    postgres_dsn: str = "postgresql://postgres@localhost:5432/kavach_db"
    enable_vlm_validation: bool = False
    groq_timeout_seconds: float = 8.0

    # Auth/async DB settings
    database_url: str = ""
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_min: int = 30
    refresh_token_expire_days: int = 7
    max_failed_attempts: int = 5
    lockout_duration_min: int = 15
    reset_token_expire_min: int = 15
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@kavachportal.in"
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

    def verify_groq_key(self) -> bool:
        return bool(self.groq_api_key and self.groq_api_key.startswith("gsk_"))

    @property
    def PROJECT_NAME(self) -> str:
        return self.app_name

    @property
    def APP_NAME(self) -> str:
        return self.app_name

    @property
    def API_V1_STR(self) -> str:
        return self.api_v1_str

    @property
    def API_PREFIX(self) -> str:
        return self.api_v1_str

    @property
    def GROQ_API_KEY(self) -> str:
        return self.groq_api_key

    @property
    def REDIS_URL(self) -> str:
        return self.redis_url

    @property
    def POSTGRES_DSN(self) -> str:
        return self.postgres_dsn

    @property
    def DATABASE_URL(self) -> str:
        if self.database_url:
            return self.database_url
        # Fallback for existing POSTGRES_DSN values.
        if self.postgres_dsn.startswith("postgresql+asyncpg://"):
            return self.postgres_dsn
        if self.postgres_dsn.startswith("postgresql://"):
            return self.postgres_dsn.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.postgres_dsn

    @property
    def ENABLE_VLM_VALIDATION(self) -> bool:
        return self.enable_vlm_validation

    @property
    def GROQ_TIMEOUT_SECONDS(self) -> float:
        return self.groq_timeout_seconds

    @property
    def DEBUG(self) -> bool:
        return self.debug

    @property
    def SECRET_KEY(self) -> str:
        return self.secret_key

    @property
    def JWT_SECRET_KEY(self) -> str:
        return self.jwt_secret_key or self.secret_key

    @property
    def ALGORITHM(self) -> str:
        return self.algorithm

    @property
    def JWT_ALGORITHM(self) -> str:
        return self.jwt_algorithm or self.algorithm

    @property
    def ACCESS_TOKEN_EXPIRE_MIN(self) -> int:
        return self.access_token_expire_min

    @property
    def REFRESH_TOKEN_EXPIRE_DAYS(self) -> int:
        return self.refresh_token_expire_days

    @property
    def MAX_FAILED_ATTEMPTS(self) -> int:
        return self.max_failed_attempts

    @property
    def LOCKOUT_DURATION_MIN(self) -> int:
        return self.lockout_duration_min

    @property
    def RESET_TOKEN_EXPIRE_MIN(self) -> int:
        return self.reset_token_expire_min

    @property
    def ALLOWED_ORIGINS(self) -> list[str]:
        return self.allowed_origins


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
