from typing import Any, Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import settings
from storage.minio_backend import MinioStorage

app = FastAPI(
    title="Uploader Service",
    description="Retail store data upload service",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/")
def root():
    return {"message": "Uploader Service Running"}


class MinioUploadRequest(BaseModel):
    key: str
    records: list[dict[str, Any]]
    create_bucket: bool = True


def _validate_api_key(authorization: Optional[str]) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1]
    if token != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")


@app.post("/minio")
def upload_to_minio(
    payload: MinioUploadRequest,
    authorization: Optional[str] = Header(default=None),
):
    _validate_api_key(authorization)
    storage = MinioStorage(
        bucket=settings.minio_bucket,
        endpoint=settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        region=settings.minio_region,
    )
    storage.upload_records(payload.records, payload.key, create_bucket=payload.create_bucket)
    return {"status": "uploaded", "key": payload.key, "records": len(payload.records)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
