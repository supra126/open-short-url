import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/common/database/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { StorageService } from '@/modules/storage/storage.service';
import { ImageOptimizerService } from './image-optimizer.service';
import { validateOgImage } from './og-image-validator';

@Injectable()
export class OgImageService {
  private readonly logger = new Logger(OgImageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly storageService: StorageService,
    private readonly imageOptimizer: ImageOptimizerService
  ) {}

  /**
   * Upload and optimize an OG image for a URL
   */
  async uploadForUrl(
    urlId: string,
    userId: string,
    file: { buffer: Buffer; mimetype: string },
    userRole?: 'ADMIN' | 'USER'
  ): Promise<{ key: string; proxyUrl: string }> {
    // Check URL ownership
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!url) {
      throw new NotFoundException('URL not found');
    }

    // Validate image (magic bytes)
    const detectedMimeType = await validateOgImage(file.buffer, file.mimetype);

    // Optimize image
    const optimized = await this.imageOptimizer.optimize(
      file.buffer,
      detectedMimeType
    );

    // Generate S3 key
    const key = `og-images/${urlId}/${Date.now()}.${optimized.extension}`;

    // Upload new image first (before deleting old one)
    await this.storageService.upload(optimized.buffer, key, {
      contentType: optimized.mimeType,
      acl: 'private',
    });

    // Update URL record
    const oldOgImage = url.ogImage;
    await this.prisma.url.update({
      where: { id: urlId },
      data: { ogImage: key },
    });

    // Clear URL cache so the new ogImage is reflected
    await this.cacheService.del(`url:${urlId}`);
    await this.cacheService.del(`url:slug:${url.slug}`);

    // Delete old OG image after successful upload and DB update
    if (oldOgImage) {
      try {
        await this.storageService.delete(oldOgImage);
        this.logger.log(`Deleted old OG image: ${oldOgImage}`);
      } catch (error) {
        this.logger.warn(
          `Failed to delete old OG image: ${oldOgImage}`,
          error instanceof Error ? error.message : undefined
        );
      }
    }

    this.logger.log(`OG image uploaded for URL ${urlId}: ${key}`);

    return {
      key,
      proxyUrl: `/api/og-images/${encodeURIComponent(key)}`,
    };
  }

  /**
   * Serve an OG image by streaming from S3
   */
  async serveImage(key: string) {
    // Security: normalize path and only allow keys under og-images/
    const normalizedKey = key
      .replace(/\/{2,}/g, '/')
      .split('/')
      .reduce((acc, seg) => {
        if (seg === '..') acc.pop();
        else if (seg && seg !== '.') acc.push(seg);
        return acc;
      }, [] as string[])
      .join('/');

    if (!normalizedKey.startsWith('og-images/')) {
      throw new ForbiddenException('Invalid image key');
    }

    try {
      return await this.storageService.getObject(normalizedKey);
    } catch (error) {
      this.logger.error(
        `Failed to serve OG image: ${normalizedKey}`,
        error instanceof Error ? error.message : undefined
      );
      throw new NotFoundException('Image not found');
    }
  }

  /**
   * Delete OG image from S3 (event-driven cleanup)
   */
  @OnEvent('og-image.cleanup')
  async handleOgImageCleanup(payload: { ogImageKey: string }) {
    try {
      await this.storageService.delete(payload.ogImageKey);
      this.logger.log(`Cleaned up OG image: ${payload.ogImageKey}`);
    } catch (error) {
      this.logger.warn(
        `Failed to clean up OG image: ${payload.ogImageKey}`,
        error instanceof Error ? error.message : undefined
      );
    }
  }
}
