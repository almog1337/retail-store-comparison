export default () => ({
  apiKey: process.env.UPLOADER_API_KEY ?? "dev-key",
  database: {
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: parseInt(process.env.POSTGRES_PORT ?? "5432", 10),
    user: process.env.POSTGRES_USER ?? "postgres",
    password: process.env.POSTGRES_PASSWORD ?? "postgres",
    name: process.env.POSTGRES_DB ?? "retail_store",
  },
  s3: {
    bucket: process.env.MINIO_BUCKET ?? "retail-price-datalake",
    endpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
    accessKey: process.env.MINIO_ROOT_USER ?? "admin",
    secretKey: process.env.MINIO_ROOT_PASSWORD ?? "admin12345",
    region: process.env.S3_REGION ?? "us-east-1",
  },
});
