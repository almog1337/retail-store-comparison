import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { IStorageBackend } from './storage.interface';

@Injectable()
export class MinioStorageService implements IStorageBackend {
  private readonly logger = new Logger(MinioStorageService.name);

  constructor(private readonly configService: ConfigService) {}

  private createClient(): S3Client {
    return new S3Client({
      endpoint: this.configService.get<string>('minio.endpoint'),
      region: this.configService.get<string>('minio.region'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.get<string>('minio.accessKey'),
        secretAccessKey: this.configService.get<string>('minio.secretKey'),
      },
    });
  }

  private async ensureBucket(client: S3Client, bucket: string): Promise<void> {
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (err: any) {
      const statusCode = err.$metadata?.httpStatusCode;
      if (statusCode === 403 || statusCode === 404) {
        try {
          await client.send(new CreateBucketCommand({ Bucket: bucket }));
        } catch (createErr: any) {
          const msg = String(createErr);
          if (
            !msg.includes('BucketAlreadyExists') &&
            !msg.includes('BucketAlreadyOwnedByYou')
          ) {
            throw createErr;
          }
        }
      } else {
        throw err;
      }
    }
  }

  async uploadRecords(
    records: Record<string, unknown>[],
    key: string,
    createBucket: boolean,
  ): Promise<void> {
    const client = this.createClient();
    const bucket = this.configService.get<string>('minio.bucket');

    if (createBucket) {
      await this.ensureBucket(client, bucket);
    }

    const body = records.map((r) => JSON.stringify(r)).join('\n');

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(body, 'utf-8'),
        ContentType: 'application/x-ndjson',
      }),
    );

    this.logger.log(`Uploaded data to s3://${bucket}/${key}`);
  }
}
