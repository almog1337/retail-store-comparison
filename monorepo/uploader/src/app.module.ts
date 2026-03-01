import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { StorageModule } from './storage/storage.module';
import { UploadModule } from './upload/upload.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: '.env',
    }),
    StorageModule,
    UploadModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
