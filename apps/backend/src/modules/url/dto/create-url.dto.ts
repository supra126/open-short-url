import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUrl,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
} from 'class-validator';
import { IsSafeUrl } from '@/common/validators/safe-url.validator';

export class CreateUrlDto {
  @ApiProperty({
    description: 'Original URL',
    example: 'https://example.com/very-long-url',
  })
  @IsUrl({}, { message: 'Please enter a valid URL' })
  @IsSafeUrl({ message: 'URL must be a public address. Internal network addresses are not allowed.' })
  originalUrl!: string;

  @ApiPropertyOptional({
    description: 'Custom short URL slug (3-50 characters, alphanumeric, underscore, and hyphen only)',
    example: 'my-custom-link',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters' })
  @MaxLength(50, { message: 'Slug must be at most 50 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Slug can only contain alphanumeric characters, underscores, and hyphens',
  })
  @IsOptional()
  customSlug?: string;

  @ApiPropertyOptional({
    description: 'Title',
    example: 'My Important Link',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Password protection (optional)',
    minLength: 4,
    maxLength: 128,
  })
  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'Expiration time (ISO 8601 format)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'UTM Source',
    example: 'newsletter',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255, { message: 'UTM Source must not exceed 255 characters' })
  @IsOptional()
  utmSource?: string;

  @ApiPropertyOptional({
    description: 'UTM Medium',
    example: 'email',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255, { message: 'UTM Medium must not exceed 255 characters' })
  @IsOptional()
  utmMedium?: string;

  @ApiPropertyOptional({
    description: 'UTM Campaign',
    example: 'summer_sale',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255, { message: 'UTM Campaign must not exceed 255 characters' })
  @IsOptional()
  utmCampaign?: string;

  @ApiPropertyOptional({
    description: 'UTM Term',
    example: 'discount',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255, { message: 'UTM Term must not exceed 255 characters' })
  @IsOptional()
  utmTerm?: string;

  @ApiPropertyOptional({
    description: 'UTM Content',
    example: 'banner_top',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255, { message: 'UTM Content must not exceed 255 characters' })
  @IsOptional()
  utmContent?: string;
}
