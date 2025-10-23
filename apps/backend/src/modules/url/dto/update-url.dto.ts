import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUrl,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUrlDto {
  @ApiPropertyOptional({
    description: 'Original URL',
    example: 'https://example.com/new-url',
  })
  @IsUrl({}, { message: 'Please enter a valid URL' })
  @IsOptional()
  originalUrl?: string;

  @ApiPropertyOptional({
    description: 'Title',
    example: 'Updated Title',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Status',
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
    example: 'ACTIVE',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['ACTIVE', 'INACTIVE', 'EXPIRED'], {
    message: 'Status must be ACTIVE, INACTIVE, or EXPIRED',
  })
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

  @ApiPropertyOptional({
    description: 'Password protection (set to null to remove password)',
    minLength: 4,
  })
  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters' })
  @IsOptional()
  password?: string | null;

  @ApiPropertyOptional({
    description: 'Expiration time (ISO 8601 format, set to null to remove expiration)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string | null;

  @ApiPropertyOptional({
    description: 'UTM Source',
    example: 'newsletter',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  utmSource?: string;

  @ApiPropertyOptional({
    description: 'UTM Medium',
    example: 'email',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  utmMedium?: string;

  @ApiPropertyOptional({
    description: 'UTM Campaign',
    example: 'summer_sale',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  utmCampaign?: string;

  @ApiPropertyOptional({
    description: 'UTM Term',
    example: 'discount',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  utmTerm?: string;

  @ApiPropertyOptional({
    description: 'UTM Content',
    example: 'banner_top',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  utmContent?: string;
}
