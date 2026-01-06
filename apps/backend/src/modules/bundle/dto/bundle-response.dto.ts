import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BundleStatus } from '@prisma/client';
import { PaginationMetaDto } from '@/common/dto/paginated-response.dto';

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

export class BundleListResponseDto extends PaginationMetaDto {
  @ApiProperty({ type: [BundleResponseDto] })
  data!: BundleResponseDto[];
}

export class TopUrlDto {
  @ApiProperty({ description: 'URL slug' })
  slug!: string;

  @ApiProperty({ description: 'Number of clicks' })
  clicks!: number;
}

export class ClickTrendDataPoint {
  @ApiProperty({ description: 'Date string (YYYY-MM-DD)' })
  date!: string;

  @ApiProperty({ description: 'Number of clicks on this date' })
  clicks!: number;
}

export class BundleStatsDto {
  @ApiProperty()
  bundleId!: string;

  @ApiProperty()
  totalClicks!: number;

  @ApiProperty()
  urlCount!: number;

  @ApiPropertyOptional({ type: TopUrlDto, description: 'Top performing URL' })
  topUrl?: TopUrlDto;

  @ApiProperty({ type: [ClickTrendDataPoint], description: 'Click trend data (last 7 days)' })
  clickTrend!: ClickTrendDataPoint[];
}
