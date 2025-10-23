import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BundleStatus } from '@prisma/client';

export class BundleUrlDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({
    description: 'Complete short URL',
    example: 'http://localhost:4101/abc123',
  })
  shortUrl!: string;

  @ApiProperty()
  originalUrl!: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiProperty()
  clickCount!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  order!: number;
}

export class BundleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  color!: string;

  @ApiProperty()
  icon!: string;

  @ApiProperty({ enum: BundleStatus })
  status!: BundleStatus;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  urlCount!: number;

  @ApiProperty()
  totalClicks!: number;

  @ApiPropertyOptional({ type: [BundleUrlDto] })
  urls?: BundleUrlDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class BundleListResponseDto {
  @ApiProperty({ type: [BundleResponseDto] })
  data!: BundleResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class BundleStatsDto {
  @ApiProperty()
  bundleId!: string;

  @ApiProperty()
  totalClicks!: number;

  @ApiProperty()
  urlCount!: number;

  @ApiProperty({ description: 'Top performing URL' })
  topUrl?: {
    slug: string;
    clicks: number;
  };

  @ApiProperty({ description: 'Click trend data (last 7 days)' })
  clickTrend!: Array<{
    date: string;
    clicks: number;
  }>;
}
