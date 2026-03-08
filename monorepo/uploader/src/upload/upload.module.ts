import { Module } from "@nestjs/common";
import { S3Module } from "../s3/s3.module";
import { DatabaseModule } from "../database/database.module";
import { ApiKeyGuard } from "./guards/api-key.guard";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { RecordMapperFactory } from "./mappers/abstractions/prices/record-mapper.factory";
import { ShufersalRecordMapper } from "./mappers/shufersal/prices/shufersal-record.mapper";
import { StoreMapperFactory } from "./mappers/abstractions/stores/store-mapper.factory";
import { ShufersalStoreMapper } from "./mappers/shufersal/stores/shufersal-stores.mapper";

@Module({
  imports: [S3Module, DatabaseModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    RecordMapperFactory,
    StoreMapperFactory,
    ShufersalRecordMapper,
    ShufersalStoreMapper,
    ApiKeyGuard,
  ],
})
export class UploadModule {}
