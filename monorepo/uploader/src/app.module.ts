import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { DatabaseModule } from "./database/database.module";
import { S3Module } from "./s3/s3.module";
import { UploadModule } from "./upload/upload.module";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: "../../.env",
    }),
    DatabaseModule,
    S3Module,
    UploadModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
