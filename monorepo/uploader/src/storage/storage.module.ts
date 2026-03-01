import { Module } from "@nestjs/common";
import { MinioStorageService } from "./minio-storage.service";
import { STORAGE_BACKEND } from "./storage.interface";
import { RecordValidator } from "./record-validator";
import { KeyGenerator } from "./key-generator";

@Module({
  providers: [
    { provide: STORAGE_BACKEND, useClass: MinioStorageService },
    RecordValidator,
    KeyGenerator,
  ],
  exports: [STORAGE_BACKEND, RecordValidator, KeyGenerator],
})
export class StorageModule {}
