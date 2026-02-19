from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SPOTIFY_CLIENT_ID: str
    SPOTIFY_CLIENT_SECRET: str
    SPOTIFY_REDIRECT_URI: str = "http://127.0.0.1:8000/callback"

    # Secret key for signing JWTs — change this in production!
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 2

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
