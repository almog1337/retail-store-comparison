import { Module } from "@nestjs/common";
import { S3Module } from "../s3/s3.module";
import { ApiKeyGuard } from "./guards/api-key.guard";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";

@Module({
  imports: [S3Module],
  controllers: [UploadController],
  providers: [UploadService, ApiKeyGuard],
})
export class UploadModule {}
