import { Module } from "@nestjs/common";
import { S3Service } from "./s3.service";
import { S3_BACKEND } from "./s3.interface";
import { RecordValidator } from "./record-validator";
import { KeyGenerator } from "./key-generator";

@Module({
  providers: [
    { provide: S3_BACKEND, useClass: S3Service },
    RecordValidator,
    KeyGenerator,
  ],
  exports: [S3_BACKEND, RecordValidator, KeyGenerator],
})
export class S3Module {}
