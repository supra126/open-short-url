import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '@/common/dto/paginated-response.dto';
import { UrlStatus } from '@prisma/client';

/**
 * DTO for exporting UrlStatus enum to OpenAPI
 */
export class UrlStatusDto {
  @ApiProperty({
    description: 'URL status enum values',
    enum: UrlStatus,
    enumName: 'UrlStatus',
    example: UrlStatus.ACTIVE,
  })
  status!: UrlStatus;
}

export class UrlResponseDto {
  @ApiProperty({
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  id!: string;

  @ApiProperty({
    description: 'Short URL slug',
    example: 'abc123',
  })
  slug!: string;

  @ApiProperty({
    description: 'Complete short URL',
    example: 'http://localhost:4101/abc123',
  })
  shortUrl!: string;

  @ApiProperty({
    description: 'Original URL',
    example: 'https://example.com/very-long-url',
  })
  originalUrl!: string;

  @ApiPropertyOptional({
    description: 'Title',
    example: 'My Important Link',
  })
  title?: string;

  @ApiProperty({
    description: 'User ID',
    example: 'clusr123456789',
  })
  userId!: string;

  @ApiProperty({
    description: 'Status',
    enum: UrlStatus,
    enumName: 'UrlStatus',
    example: UrlStatus.ACTIVE,
  })
  status!: UrlStatus;

  @ApiProperty({
    description: 'Click count',
    example: 142,
  })
  clickCount!: number;

  @ApiPropertyOptional({
    description: 'Whether password protection is enabled',
    example: false,
  })
  hasPassword?: boolean;

  @ApiPropertyOptional({
    description: 'Expiration time (ISO 8601 format)',
    example: '2025-12-31T23:59:59.000Z',
  })
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'UTM Source parameter',
    example: 'newsletter',
  })
  utmSource?: string;

  @ApiPropertyOptional({
    description: 'UTM Medium parameter',
    example: 'email',
  })
  utmMedium?: string;

  @ApiPropertyOptional({
    description: 'UTM Campaign parameter',
    example: 'summer_sale',
  })
  utmCampaign?: string;

  @ApiPropertyOptional({
    description: 'UTM Term parameter',
    example: 'discount',
  })
  utmTerm?: string;

  @ApiPropertyOptional({
    description: 'UTM Content parameter',
    example: 'banner_top',
  })
  utmContent?: string;

  @ApiProperty({
    description: 'Whether A/B testing is enabled',
    example: false,
  })
  isAbTest!: boolean;

  @ApiProperty({
    description: 'Whether smart routing is enabled',
    example: false,
  })
  isSmartRouting!: boolean;

  @ApiPropertyOptional({
    description: 'Default URL when no routing rules match',
    example: 'https://example.com/default',
  })
  defaultUrl?: string;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601 format)',
    example: '2025-10-01T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601 format)',
    example: '2025-10-17T09:08:52.000Z',
  })
  updatedAt!: Date;
}

export class UrlListResponseDto extends PaginationMetaDto {
  @ApiProperty({
    description: 'URL list',
    type: [UrlResponseDto],
  })
  data!: UrlResponseDto[];
}

/**
 * Dashboard statistics response DTO
 */
export class DashboardStatsResponseDto {
  @ApiProperty({
    description: 'Total number of URLs',
    example: 150,
  })
  totalUrls!: number;

  @ApiProperty({
    description: 'Number of active URLs',
    example: 120,
  })
  activeUrls!: number;

  @ApiProperty({
    description: 'Number of inactive URLs',
    example: 20,
  })
  inactiveUrls!: number;

  @ApiProperty({
    description: 'Number of expired URLs',
    example: 10,
  })
  expiredUrls!: number;
}

/**
 * Top performing URL response DTO
 */
export class TopPerformingUrlDto {
  @ApiProperty({
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  id!: string;

  @ApiProperty({
    description: 'Short URL slug',
    example: 'abc123',
  })
  slug!: string;

  @ApiPropertyOptional({
    description: 'Title',
    example: 'My Important Link',
    type: 'string',
    nullable: true,
  })
  title!: string | null;

  @ApiProperty({
    description: 'Original URL',
    example: 'https://example.com/very-long-url',
  })
  originalUrl!: string;

  @ApiProperty({
    description: 'Click count',
    example: 142,
  })
  clickCount!: number;

  @ApiProperty({
    description: 'Status',
    enum: UrlStatus,
    enumName: 'UrlStatus',
    example: UrlStatus.ACTIVE,
  })
  status!: UrlStatus;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601 format)',
    example: '2025-10-01T10:30:00.000Z',
  })
  createdAt!: Date;
}
