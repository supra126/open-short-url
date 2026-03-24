import { BadRequestException, Logger } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_OG_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const logger = new Logger('OgImageValidator');

/**
 * Validate OG image file using magic bytes detection
 * Returns the actual detected MIME type
 */
export async function validateOgImage(
  buffer: Buffer,
  declaredMimeType: string
): Promise<string> {
  // Validate size
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new BadRequestException(
      `File size exceeds limit. Maximum: ${MAX_SIZE_BYTES / 1024 / 1024}MB, received: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`
    );
  }

  if (buffer.length === 0) {
    throw new BadRequestException('File is empty');
  }

  // Detect actual file type via magic bytes
  const detectedType = await fileTypeFromBuffer(buffer);

  if (!detectedType) {
    throw new BadRequestException(
      'Unable to detect file type. Please ensure the file is a valid image.'
    );
  }

  logger.log(
    `OG image validation: declared=${declaredMimeType}, detected=${detectedType.mime}`
  );

  // Check if detected type is in our allowlist
  if (!ALLOWED_OG_MIME_TYPES.has(detectedType.mime)) {
    throw new BadRequestException(
      `Unsupported image type: ${detectedType.mime}. Allowed types: ${[...ALLOWED_OG_MIME_TYPES].join(', ')}`
    );
  }

  return detectedType.mime;
}
