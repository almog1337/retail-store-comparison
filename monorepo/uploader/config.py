from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Uploader Service"
    database_url: str = "sqlite:///./uploader.db"
    debug: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
