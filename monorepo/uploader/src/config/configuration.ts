export default () => ({
  apiKey: process.env.UPLOADER_API_KEY ?? "dev-key",
  s3: {
    bucket: process.env.S3_BUCKET ?? "retail-price-datalake",
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
    accessKey: process.env.S3_ACCESS_KEY ?? "admin",
    secretKey: process.env.S3_SECRET_KEY ?? "admin12345",
    region: process.env.S3_REGION ?? "us-east-1",
  },
});
