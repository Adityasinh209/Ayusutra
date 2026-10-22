from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str = "sqlite:///./ayursutra.db"
    # Path to Aiven (or other) CA PEM on the server; optional if system CAs work.
    mysql_ssl_ca: str = ""
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175"
    clerk_secret_key: str = ""
    clerk_frontend_api: str = ""
    allow_test_tokens: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
