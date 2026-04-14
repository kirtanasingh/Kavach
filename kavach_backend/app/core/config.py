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

    groq_api_key: str = ""
    app_name: str = "Kavach Animal Disease Detection Microservice"
    debug: bool = False
    upload_dir: str = "uploads"
    max_image_size_mb: int = 10
    api_v1_str: str = "/api/v1"
    secret_key: str = ""
    algorithm: str = "HS256"
    redis_url: str = "redis://localhost:6379/0"

    def verify_groq_key(self) -> bool:
        return bool(self.groq_api_key and self.groq_api_key.startswith("gsk_"))

    @property
    def PROJECT_NAME(self) -> str:
        return self.app_name

    @property
    def API_V1_STR(self) -> str:
        return self.api_v1_str

    @property
    def GROQ_API_KEY(self) -> str:
        return self.groq_api_key

    @property
    def REDIS_URL(self) -> str:
        return self.redis_url

    @property
    def SECRET_KEY(self) -> str:
        return self.secret_key

    @property
    def ALGORITHM(self) -> str:
        return self.algorithm


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
