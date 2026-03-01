import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ApiKeyGuard } from './guards/api-key.guard';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [StorageModule],
  controllers: [UploadController],
  providers: [UploadService, ApiKeyGuard],
})
export class UploadModule {}
