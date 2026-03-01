import { Module } from '@nestjs/common';
import { MinioStorageService } from './minio-storage.service';
import { STORAGE_BACKEND } from './storage.interface';

@Module({
  providers: [{ provide: STORAGE_BACKEND, useClass: MinioStorageService }],
  exports: [STORAGE_BACKEND],
})
export class StorageModule {}
