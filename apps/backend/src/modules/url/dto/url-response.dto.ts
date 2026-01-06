import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '@/common/dto/paginated-response.dto';

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
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
    example: 'ACTIVE',
  })
  status!: string;

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
