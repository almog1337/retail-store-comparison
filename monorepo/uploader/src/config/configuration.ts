export default () => ({
  apiKey: process.env.UPLOADER_API_KEY ?? "dev-key",
  minio: {
    bucket: process.env.MINIO_BUCKET ?? "retail-price-datalake",
    endpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "admin",
    secretKey: process.env.MINIO_SECRET_KEY ?? "admin12345",
    region: process.env.MINIO_REGION ?? "us-east-1",
  },
});
