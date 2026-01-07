import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { IsSafeUrl } from '@/common/validators/safe-url.validator';

/**
 * Create URL Variant DTO
 */
export class CreateVariantDto {
  @ApiProperty({
    description: 'Variant name (e.g., "Control Group", "Variant A")',
    example: 'Control Group',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Target URL for this variant',
    example: 'https://example.com/landing-page-v1',
  })
  @IsUrl({}, { message: 'Target URL must be a valid URL' })
  @IsSafeUrl({ message: 'Target URL must be a public URL. Internal network addresses are not allowed.' })
  targetUrl!: string;

  @ApiProperty({
    description: 'Weight for traffic distribution (0-100)',
    example: 50,
    minimum: 0,
    maximum: 100,
    default: 50,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  weight?: number;

  @ApiProperty({
    description: 'Whether this variant is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Update URL Variant DTO
 */
export class UpdateVariantDto extends PartialType(CreateVariantDto) {}

/**
 * URL Variant Response DTO
 */
export class VariantResponseDto {
  @ApiProperty({ description: 'Variant ID', example: 'clx1234567890' })
  id!: string;

  @ApiProperty({ description: 'URL ID this variant belongs to' })
  urlId!: string;

  @ApiProperty({ description: 'Variant name', example: 'Control Group' })
  name!: string;

  @ApiProperty({
    description: 'Target URL',
    example: 'https://example.com/landing-page-v1',
  })
  targetUrl!: string;

  @ApiProperty({
    description: 'Weight for traffic distribution',
    example: 50,
  })
  weight!: number;

  @ApiProperty({ description: 'Whether this variant is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Total click count for this variant' })
  clickCount!: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

/**
 * Variant Statistics DTO
 */
export class VariantStatsDto {
  @ApiProperty({ description: 'Variant information' })
  variant!: VariantResponseDto;

  @ApiProperty({
    description: 'Click through rate (clicks / total URL clicks)',
    example: 45.5,
  })
  clickThroughRate!: number;

  @ApiProperty({
    description: 'Conversion rate (if tracking conversions)',
    example: 12.3,
    required: false,
  })
  conversionRate?: number;
}

/**
 * Variant List Response DTO
 */
export class VariantListResponseDto {
  @ApiProperty({
    description: 'List of variants',
    type: [VariantResponseDto],
  })
  variants!: VariantResponseDto[];

  @ApiProperty({ description: 'Total clicks across all variants' })
  totalClicks!: number;

  @ApiProperty({
    description: 'Variant statistics',
    type: [VariantStatsDto],
  })
  stats!: VariantStatsDto[];
}
