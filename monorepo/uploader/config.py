from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Uploader Service"
    database_url: str = "sqlite:///./uploader.db"
    debug: bool = False
    api_key: str = Field(default="dev-key", validation_alias="UPLOADER_API_KEY")
    minio_bucket: str = Field(default="retail-price-datalake", validation_alias="MINIO_BUCKET")
    minio_endpoint: str = Field(default="http://localhost:9000", validation_alias="MINIO_ENDPOINT")
    minio_access_key: str = Field(default="minioadmin", validation_alias="MINIO_ACCESS_KEY")
    minio_secret_key: str = Field(default="minioadmin123", validation_alias="MINIO_SECRET_KEY")
    minio_region: str = Field(default="us-east-1", validation_alias="MINIO_REGION")

    class Config:
        env_file = ".env"

settings = Settings()
