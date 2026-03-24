import { Readable } from 'stream';

export interface UploadOptions {
  bucket: string;
  key: string;
  body: Buffer | Readable;
  contentType?: string;
  contentDisposition?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read';
}

export interface UploadResult {
  bucket: string;
  key: string;
  url?: string;
  etag?: string;
  size?: number;
}

export interface GetSignedUrlOptions {
  bucket: string;
  key: string;
  expiresIn?: number;
  responseContentDisposition?: string;
}

export interface DeleteOptions {
  bucket: string;
  key: string;
}

export interface CopyOptions {
  sourceBucket: string;
  sourceKey: string;
  destinationBucket: string;
  destinationKey: string;
  metadata?: Record<string, string>;
}

export interface FileInfo {
  bucket: string;
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
  etag?: string;
  metadata?: Record<string, string>;
}

export interface ListOptions {
  bucket: string;
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListResult {
  files: FileInfo[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

export interface GetObjectResult {
  body: Readable;
  contentType?: string;
  contentLength?: number;
}

export interface IStorageProvider {
  upload(options: UploadOptions): Promise<UploadResult>;
  delete(options: DeleteOptions): Promise<void>;
  deleteMany(bucket: string, keys: string[]): Promise<void>;
  fileExists(bucket: string, key: string): Promise<boolean>;
  getFileInfo(bucket: string, key: string): Promise<FileInfo | null>;
  getSignedUrl(options: GetSignedUrlOptions): Promise<string>;
  getObject(bucket: string, key: string): Promise<GetObjectResult>;
  listFiles(options: ListOptions): Promise<ListResult>;
  copy(options: CopyOptions): Promise<UploadResult>;
  move(options: CopyOptions): Promise<UploadResult>;
  validateConfig(): Promise<boolean>;
}
