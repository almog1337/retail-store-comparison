export default () => ({
  apiKey: process.env.UPLOADER_API_KEY ?? "dev-key",
  database: {
    host: process.env.DB_HOST ?? "localhost",
    port: parseInt(process.env.DB_PORT ?? "5432", 10),
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    name: process.env.DB_NAME ?? "retail_store",
  },
  s3: {
    bucket: process.env.S3_BUCKET ?? "retail-price-datalake",
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
    accessKey: process.env.S3_ACCESS_KEY ?? "admin",
    secretKey: process.env.S3_SECRET_KEY ?? "admin12345",
    region: process.env.S3_REGION ?? "us-east-1",
  },
});
