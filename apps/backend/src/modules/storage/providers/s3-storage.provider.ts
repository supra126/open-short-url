import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import {
  IStorageProvider,
  UploadOptions,
  UploadResult,
  DeleteOptions,
  GetSignedUrlOptions,
  FileInfo,
  ListOptions,
  ListResult,
  CopyOptions,
  GetObjectResult,
} from '../interfaces/storage-provider.interface';

/**
 * S3-compatible storage provider
 * Supports AWS S3, Cloudflare R2, MinIO
 */
@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly endpoint?: string;
  private readonly region: string;
  private readonly publicUrl?: string;
  private readonly globalPrefix?: string;
  private readonly isR2: boolean;

  private readonly MAX_DELETE_OBJECTS = 1000;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('S3_REGION', 'auto');
    this.endpoint = this.configService.get<string>('S3_ENDPOINT');
    this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL');
    this.globalPrefix = this.configService.get<string>('S3_GLOBAL_PREFIX');

    this.isR2 = this.endpoint?.includes('r2.cloudflarestorage.com') || false;

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>(
          'S3_SECRET_ACCESS_KEY',
          ''
        ),
      },
      forcePathStyle: this.endpoint ? true : false,
    });

    const storageType = this.isR2
      ? 'Cloudflare R2'
      : this.endpoint
        ? 'S3-Compatible Storage'
        : 'AWS S3';
    this.logger.log(
      `S3StorageProvider initialized with ${storageType}${this.globalPrefix ? `, global prefix: ${this.globalPrefix}` : ''}`
    );

    if (this.isR2) {
      this.logger.warn(
        'Detected Cloudflare R2: ACL will be ignored. All files will use Pre-signed URLs for access.'
      );
    }
  }

  private applyGlobalPrefix(key: string): string {
    if (!this.globalPrefix) return key;
    const cleanKey = key.startsWith('/') ? key.substring(1) : key;
    const cleanPrefix = this.globalPrefix.endsWith('/')
      ? this.globalPrefix.substring(0, this.globalPrefix.length - 1)
      : this.globalPrefix;
    return `${cleanPrefix}/${cleanKey}`;
  }

  private removeGlobalPrefix(key: string): string {
    if (!this.globalPrefix) return key;
    const cleanPrefix = this.globalPrefix.endsWith('/')
      ? this.globalPrefix.substring(0, this.globalPrefix.length - 1)
      : this.globalPrefix;
    if (key.startsWith(cleanPrefix + '/')) {
      return key.substring(cleanPrefix.length + 1);
    }
    return key;
  }

  private encodeS3Path(path: string): string {
    return path
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      const keyWithPrefix = this.applyGlobalPrefix(options.key);

      const commandParams: any = {
        Bucket: options.bucket,
        Key: keyWithPrefix,
        Body: options.body,
        ContentType: options.contentType,
        ContentDisposition: options.contentDisposition,
        Metadata: options.metadata,
      };

      if (!this.isR2 && options.acl) {
        commandParams.ACL = options.acl;
      }

      const command = new PutObjectCommand(commandParams);
      const response = await this.s3Client.send(command);

      let size: number | undefined;
      if (Buffer.isBuffer(options.body)) {
        size = options.body.length;
      }

      let url: string | undefined;
      if (options.acl === 'public-read' && !this.isR2) {
        url = this.getPublicUrl(options.bucket, keyWithPrefix);
      }

      return {
        bucket: options.bucket,
        key: options.key,
        url,
        etag: response.ETag,
        size,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file: ${options.key}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async delete(options: DeleteOptions): Promise<void> {
    try {
      const keyWithPrefix = this.applyGlobalPrefix(options.key);
      const command = new DeleteObjectCommand({
        Bucket: options.bucket,
        Key: keyWithPrefix,
      });
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(
        `Failed to delete file: ${options.key}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async deleteMany(bucket: string, keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      const keysWithPrefix = keys.map((key) => this.applyGlobalPrefix(key));
      const batches: string[][] = [];
      for (let i = 0; i < keysWithPrefix.length; i += this.MAX_DELETE_OBJECTS) {
        batches.push(keysWithPrefix.slice(i, i + this.MAX_DELETE_OBJECTS));
      }

      const results = await Promise.allSettled(
        batches.map(async (batch) => {
          const command = new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: batch.map((key) => ({ Key: key })),
            },
          });
          return this.s3Client.send(command);
        })
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(
          `Batch deletion partially failed: ${failures.length}/${batches.length} batches failed`
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to delete multiple files',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      const keyWithPrefix = this.applyGlobalPrefix(key);
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: keyWithPrefix,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  async getFileInfo(bucket: string, key: string): Promise<FileInfo | null> {
    try {
      const keyWithPrefix = this.applyGlobalPrefix(key);
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: keyWithPrefix,
      });
      const response = await this.s3Client.send(command);
      return {
        bucket,
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType,
        etag: response.ETag,
        metadata: response.Metadata,
      };
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  async getSignedUrl(options: GetSignedUrlOptions): Promise<string> {
    try {
      const keyWithPrefix = this.applyGlobalPrefix(options.key);
      const command = new GetObjectCommand({
        Bucket: options.bucket,
        Key: keyWithPrefix,
        ResponseContentDisposition: options.responseContentDisposition,
      });
      return await getSignedUrl(this.s3Client, command, {
        expiresIn: options.expiresIn || 3600,
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL: ${options.key}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async getObject(bucket: string, key: string): Promise<GetObjectResult> {
    try {
      const keyWithPrefix = this.applyGlobalPrefix(key);
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: keyWithPrefix,
      });
      const response = await this.s3Client.send(command);
      return {
        body: response.Body as Readable,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get object: ${key}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async listFiles(options: ListOptions): Promise<ListResult> {
    try {
      const prefixWithGlobalPrefix = options.prefix
        ? this.applyGlobalPrefix(options.prefix)
        : this.globalPrefix;

      const command = new ListObjectsV2Command({
        Bucket: options.bucket,
        Prefix: prefixWithGlobalPrefix,
        MaxKeys: options.maxKeys,
        ContinuationToken: options.continuationToken,
      });

      const response = await this.s3Client.send(command);

      const files: FileInfo[] = (response.Contents || []).map((item) => ({
        bucket: options.bucket,
        key: this.removeGlobalPrefix(item.Key || ''),
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        etag: item.ETag,
      }));

      return {
        files,
        isTruncated: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken,
      };
    } catch (error) {
      this.logger.error(
        'Failed to list files',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async copy(options: CopyOptions): Promise<UploadResult> {
    try {
      const sourceKeyWithPrefix = this.applyGlobalPrefix(options.sourceKey);
      const destinationKeyWithPrefix = this.applyGlobalPrefix(
        options.destinationKey
      );
      const encodedSourceKey = this.encodeS3Path(sourceKeyWithPrefix);
      const copySource = `${options.sourceBucket}/${encodedSourceKey}`;

      const command = new CopyObjectCommand({
        Bucket: options.destinationBucket,
        Key: destinationKeyWithPrefix,
        CopySource: copySource,
        Metadata: options.metadata,
        MetadataDirective: options.metadata ? 'REPLACE' : 'COPY',
      });

      const response = await this.s3Client.send(command);
      return {
        bucket: options.destinationBucket,
        key: options.destinationKey,
        etag: response.CopyObjectResult?.ETag,
      };
    } catch (error) {
      this.logger.error(
        `Failed to copy file: ${options.sourceKey}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async move(options: CopyOptions): Promise<UploadResult> {
    const result = await this.copy(options);
    await this.delete({
      bucket: options.sourceBucket,
      key: options.sourceKey,
    });
    return result;
  }

  async validateConfig(): Promise<boolean> {
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'S3_SECRET_ACCESS_KEY'
    );
    if (!accessKeyId || !secretAccessKey) {
      this.logger.error('S3 credentials are not configured');
      return false;
    }
    return true;
  }

  private getPublicUrl(bucket: string, key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    if (this.endpoint) {
      return `${this.endpoint}/${bucket}/${key}`;
    }
    return `https://${bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
