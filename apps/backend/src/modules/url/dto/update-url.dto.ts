import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUrl,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsSafeUrl } from '@/common/validators/safe-url.validator';

/**
 * Transform helper to convert empty strings to undefined
 */
const emptyToUndefined = ({ value }: TransformFnParams): unknown =>
  value === '' ? undefined : value;

export class UpdateUrlDto {
  @ApiPropertyOptional({
    description: 'Original URL',
    example: 'https://example.com/new-url',
  })
  @IsUrl({}, { message: 'Please enter a valid URL' })
  @IsSafeUrl({ message: 'URL must be a public address. Internal network addresses are not allowed.' })
  @IsOptional()
  originalUrl?: string;

  @ApiPropertyOptional({
    description: 'Title',
    example: 'Updated Title',
  })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Status',
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
    example: 'ACTIVE',
  })
  @Transform(emptyToUndefined)
  @IsEnum(['ACTIVE', 'INACTIVE', 'EXPIRED'], {
    message: 'Status must be ACTIVE, INACTIVE, or EXPIRED',
  })
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

  @ApiPropertyOptional({
    description: 'Password protection (set to null to remove password)',
    minLength: 4,
    type: 'string',
    nullable: true,
  })
  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters' })
  @IsOptional()
  password?: string | null;

  @ApiPropertyOptional({
    description: 'Expiration time (ISO 8601 format, set to null to remove expiration)',
    example: '2025-12-31T23:59:59Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string | null;

  @ApiPropertyOptional({
    description: 'UTM Source',
    example: 'newsletter',
  })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  utmSource?: string;

  @ApiPropertyOptional({
    description: 'UTM Medium',
    example: 'email',
  })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  utmMedium?: string;

  @ApiPropertyOptional({
    description: 'UTM Campaign',
    example: 'summer_sale',
  })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  utmCampaign?: string;

  @ApiPropertyOptional({
    description: 'UTM Term',
    example: 'discount',
  })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  utmTerm?: string;

  @ApiPropertyOptional({
    description: 'UTM Content',
    example: 'banner_top',
  })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  utmContent?: string;
}
