import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface OptimizedImage {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

@Injectable()
export class ImageOptimizerService {
  private readonly logger = new Logger(ImageOptimizerService.name);

  /**
   * Optimize image for OG (social preview) usage
   * - Resize to max 1200x630 (maintain aspect ratio, no upscale)
   * - Strip EXIF metadata
   * - Convert to WebP (except GIF → keep as GIF)
   * - Target quality: 80
   */
  async optimize(buffer: Buffer, mimeType: string): Promise<OptimizedImage> {
    const originalSize = buffer.length;

    try {
      // GIF: keep format, just compress
      if (mimeType === 'image/gif') {
        const optimized = await sharp(buffer, { animated: true })
          .resize({
            width: 1200,
            height: 630,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .gif({ colours: 128 })
          .toBuffer();

        this.logger.log(
          `GIF optimized: ${(originalSize / 1024).toFixed(1)}KB → ${(optimized.length / 1024).toFixed(1)}KB`
        );

        return {
          buffer: optimized,
          mimeType: 'image/gif',
          extension: 'gif',
        };
      }

      // All other formats: convert to WebP
      const optimized = await sharp(buffer)
        .resize({
          width: 1200,
          height: 630,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      this.logger.log(
        `Image optimized: ${(originalSize / 1024).toFixed(1)}KB → ${(optimized.length / 1024).toFixed(1)}KB (WebP)`
      );

      return {
        buffer: optimized,
        mimeType: 'image/webp',
        extension: 'webp',
      };
    } catch (error) {
      this.logger.error(
        `Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }
}
