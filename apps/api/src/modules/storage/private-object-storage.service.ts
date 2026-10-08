import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrivateObjectStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('storage.endpoint');

    const clientConfig = {
      region:
        this.config.get<string>('storage.region') ??
        'auto',
      forcePathStyle:
        this.config.get<boolean>('storage.forcePathStyle') ?? false,
      credentials: {
        accessKeyId:
          this.config.getOrThrow<string>('storage.accessKeyId'),
        secretAccessKey:
          this.config.getOrThrow<string>('storage.secretAccessKey'),
      },
      ...(endpoint ? { endpoint } : {}),
    };

    this.client = new S3Client(clientConfig);

    this.bucket =
      this.config.getOrThrow<string>('storage.bucket');
  }

  async put(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      }),
    );
  }

  async get(key: string): Promise<Buffer> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!result.Body) {
      throw new Error('Stored object has no body');
    }

    const bytes = await result.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
