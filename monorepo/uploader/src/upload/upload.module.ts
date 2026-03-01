import { Module } from "@nestjs/common";
import { S3Module } from "../s3/s3.module";
import { DatabaseModule } from "../database/database.module";
import { ApiKeyGuard } from "./guards/api-key.guard";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { RecordMapperFactory } from "./mappers/record-mapper.factory";
import { ShufersalRecordMapper } from "./mappers/shufersal-record.mapper";

@Module({
  imports: [S3Module, DatabaseModule],
  controllers: [UploadController],
  providers: [UploadService, RecordMapperFactory, ShufersalRecordMapper, ApiKeyGuard],
})
export class UploadModule {}
