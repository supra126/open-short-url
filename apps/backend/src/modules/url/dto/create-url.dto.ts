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

export class CreateUrlDto {
  @ApiProperty({
    description: 'Original URL',
    example: 'https://example.com/very-long-url',
  })
  @IsUrl({}, { message: 'Please enter a valid URL' })
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
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Password protection (optional)',
    minLength: 4,
  })
  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters' })
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
  })
  @IsString()
  @IsOptional()
  utmSource?: string;

  @ApiPropertyOptional({
    description: 'UTM Medium',
    example: 'email',
  })
  @IsString()
  @IsOptional()
  utmMedium?: string;

  @ApiPropertyOptional({
    description: 'UTM Campaign',
    example: 'summer_sale',
  })
  @IsString()
  @IsOptional()
  utmCampaign?: string;

  @ApiPropertyOptional({
    description: 'UTM Term',
    example: 'discount',
  })
  @IsString()
  @IsOptional()
  utmTerm?: string;

  @ApiPropertyOptional({
    description: 'UTM Content',
    example: 'banner_top',
  })
  @IsString()
  @IsOptional()
  utmContent?: string;
}
