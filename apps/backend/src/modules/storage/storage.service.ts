import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
} from './interfaces/storage-provider.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly defaultBucket: string;

  constructor(
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: IStorageProvider,
    private readonly configService: ConfigService
  ) {
    this.defaultBucket = this.configService.get<string>('S3_BUCKET', '');
    this.logger.log('StorageService initialized');
  }

  async upload(
    file: Buffer | Readable,
    key: string,
    options?: {
      bucket?: string;
      contentType?: string;
      acl?: 'private' | 'public-read';
      metadata?: Record<string, string>;
    }
  ): Promise<UploadResult> {
    const uploadOptions: UploadOptions = {
      bucket: options?.bucket || this.defaultBucket,
      key,
      body: file,
      contentType: options?.contentType,
      acl: options?.acl || 'private',
      metadata: options?.metadata,
    };
    return this.storageProvider.upload(uploadOptions);
  }

  async uploadPublic(
    file: Buffer | Readable,
    key: string,
    options?: {
      bucket?: string;
      contentType?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<UploadResult> {
    return this.upload(file, key, { ...options, acl: 'public-read' });
  }

  async delete(key: string, bucket?: string): Promise<void> {
    const deleteOptions: DeleteOptions = {
      bucket: bucket || this.defaultBucket,
      key,
    };
    return this.storageProvider.delete(deleteOptions);
  }

  async deleteMany(keys: string[], bucket?: string): Promise<void> {
    return this.storageProvider.deleteMany(bucket || this.defaultBucket, keys);
  }

  async fileExists(key: string, bucket?: string): Promise<boolean> {
    return this.storageProvider.fileExists(bucket || this.defaultBucket, key);
  }

  async getFileInfo(key: string, bucket?: string): Promise<FileInfo | null> {
    return this.storageProvider.getFileInfo(bucket || this.defaultBucket, key);
  }

  async getSignedUrl(
    key: string,
    options?: {
      bucket?: string;
      expiresIn?: number;
      filename?: string;
    }
  ): Promise<string> {
    const signedUrlOptions: GetSignedUrlOptions = {
      bucket: options?.bucket || this.defaultBucket,
      key,
      expiresIn: options?.expiresIn,
    };
    if (options?.filename) {
      const safeFilename = options.filename.replace(/["\r\n\\]/g, '_');
      signedUrlOptions.responseContentDisposition = `attachment; filename="${safeFilename}"`;
    }
    return this.storageProvider.getSignedUrl(signedUrlOptions);
  }

  async getObject(key: string, bucket?: string): Promise<GetObjectResult> {
    return this.storageProvider.getObject(bucket || this.defaultBucket, key);
  }

  async listFiles(options?: {
    bucket?: string;
    prefix?: string;
    maxKeys?: number;
    continuationToken?: string;
  }): Promise<ListResult> {
    const listOptions: ListOptions = {
      bucket: options?.bucket || this.defaultBucket,
      prefix: options?.prefix,
      maxKeys: options?.maxKeys,
      continuationToken: options?.continuationToken,
    };
    return this.storageProvider.listFiles(listOptions);
  }

  async copy(
    sourceKey: string,
    destinationKey: string,
    options?: {
      sourceBucket?: string;
      destinationBucket?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<UploadResult> {
    const copyOptions: CopyOptions = {
      sourceBucket: options?.sourceBucket || this.defaultBucket,
      sourceKey,
      destinationBucket: options?.destinationBucket || this.defaultBucket,
      destinationKey,
      metadata: options?.metadata,
    };
    return this.storageProvider.copy(copyOptions);
  }

  async move(
    sourceKey: string,
    destinationKey: string,
    options?: {
      sourceBucket?: string;
      destinationBucket?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<UploadResult> {
    const copyOptions: CopyOptions = {
      sourceBucket: options?.sourceBucket || this.defaultBucket,
      sourceKey,
      destinationBucket: options?.destinationBucket || this.defaultBucket,
      destinationKey,
      metadata: options?.metadata,
    };
    return this.storageProvider.move(copyOptions);
  }

  generateUniqueFileName(originalFilename: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalFilename.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  generateDatePath(prefix?: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const basePath = `${year}/${month}`;
    return prefix ? `${prefix}/${basePath}` : basePath;
  }
}
