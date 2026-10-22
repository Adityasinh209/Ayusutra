from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_database_url(raw: str) -> str:
    url = raw.strip().strip('"').strip("'")
    if url.startswith("mysql://"):
        url = "mysql+pymysql://" + url[len("mysql://") :]
    parsed = urlparse(url)
    if parsed.scheme.startswith("mysql"):
        # PyMySQL rejects Aiven's ssl-mode=REQUIRED query param (TypeError on startup).
        query = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True) if k.lower() != "ssl-mode"]
        if not any(k == "charset" for k, _ in query):
            query.append(("charset", "utf8mb4"))
        url = urlunparse(parsed._replace(query=urlencode(query)))
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str = "sqlite:///./ayursutra.db"
    # Path to Aiven (or other) CA PEM on the server; optional if system CAs work.
    mysql_ssl_ca: str = ""
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175"
    clerk_secret_key: str = ""
    clerk_frontend_api: str = ""
    allow_test_tokens: bool = False

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value):
        if isinstance(value, str):
            return _normalize_database_url(value)
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
