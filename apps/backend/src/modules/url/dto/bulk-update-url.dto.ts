import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { UrlStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

/**
 * Bulk update status operation
 */
export class BulkUpdateStatusDto {
  @ApiProperty({
    description: 'Operation type',
    enum: ['status'],
    example: 'status',
  })
  @IsIn(['status'])
  type!: 'status';

  @ApiProperty({
    description: 'New status',
    enum: UrlStatus,
    example: 'ACTIVE',
  })
  @IsEnum(UrlStatus)
  status!: UrlStatus;
}

/**
 * Bulk add to bundle operation
 */
export class BulkAddToBundleDto {
  @ApiProperty({
    description: 'Operation type',
    enum: ['bundle'],
    example: 'bundle',
  })
  @IsIn(['bundle'])
  type!: 'bundle';

  @ApiProperty({
    description: 'Bundle ID to add URLs to',
    example: 'clxxx123456789',
  })
  @IsString()
  bundleId!: string;
}

/**
 * Bulk update expiration operation
 */
export class BulkUpdateExpirationDto {
  @ApiProperty({
    description: 'Operation type',
    enum: ['expiration'],
    example: 'expiration',
  })
  @IsIn(['expiration'])
  type!: 'expiration';

  @ApiPropertyOptional({
    description: 'New expiration date (ISO 8601 format), null to remove expiration',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string | null;
}

/**
 * Bulk update UTM parameters operation
 */
export class BulkUpdateUtmDto {
  @ApiProperty({
    description: 'Operation type',
    enum: ['utm'],
    example: 'utm',
  })
  @IsIn(['utm'])
  type!: 'utm';

  @ApiPropertyOptional({ description: 'UTM Source', maxLength: 255 })
  @IsString()
  @MaxLength(255, { message: 'UTM Source must not exceed 255 characters' })
  @IsOptional()
  utmSource?: string;

  @ApiPropertyOptional({ description: 'UTM Medium', maxLength: 255 })
  @IsString()
  @MaxLength(255, { message: 'UTM Medium must not exceed 255 characters' })
  @IsOptional()
  utmMedium?: string;

  @ApiPropertyOptional({ description: 'UTM Campaign', maxLength: 255 })
  @IsString()
  @MaxLength(255, { message: 'UTM Campaign must not exceed 255 characters' })
  @IsOptional()
  utmCampaign?: string;

  @ApiPropertyOptional({ description: 'UTM Term', maxLength: 255 })
  @IsString()
  @MaxLength(255, { message: 'UTM Term must not exceed 255 characters' })
  @IsOptional()
  utmTerm?: string;

  @ApiPropertyOptional({ description: 'UTM Content', maxLength: 255 })
  @IsString()
  @MaxLength(255, { message: 'UTM Content must not exceed 255 characters' })
  @IsOptional()
  utmContent?: string;
}

/**
 * Union type for all operations
 */
export type BulkUpdateOperation =
  | BulkUpdateStatusDto
  | BulkAddToBundleDto
  | BulkUpdateExpirationDto
  | BulkUpdateUtmDto;

/**
 * Transform function to convert operation object to the correct DTO class
 */
function transformOperation(value: unknown): BulkUpdateOperation {
  if (!value || typeof value !== 'object') {
    throw new BadRequestException('Operation must be an object');
  }

  const obj = value as Record<string, unknown>;
  const type = obj.type;

  if (!type || typeof type !== 'string') {
    throw new BadRequestException('Operation must have a valid type');
  }

  switch (type) {
    case 'status':
      return plainToInstance(BulkUpdateStatusDto, value);
    case 'bundle':
      return plainToInstance(BulkAddToBundleDto, value);
    case 'expiration':
      return plainToInstance(BulkUpdateExpirationDto, value);
    case 'utm':
      return plainToInstance(BulkUpdateUtmDto, value);
    default:
      throw new BadRequestException(
        `Invalid operation type: ${type}. Must be one of: status, bundle, expiration, utm`,
      );
  }
}

/**
 * Bulk update URL DTO
 */
export class BulkUpdateUrlDto {
  @ApiProperty({
    description: 'URL IDs to update (max 500)',
    type: [String],
    example: ['clxxx1', 'clxxx2'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least 1 URL ID is required' })
  @ArrayMaxSize(500, { message: 'Maximum 500 URLs per batch' })
  urlIds!: string[];

  @ApiProperty({
    description: 'Update operation',
    oneOf: [
      { $ref: '#/components/schemas/BulkUpdateStatusDto' },
      { $ref: '#/components/schemas/BulkAddToBundleDto' },
      { $ref: '#/components/schemas/BulkUpdateExpirationDto' },
      { $ref: '#/components/schemas/BulkUpdateUtmDto' },
    ],
  })
  @ValidateNested()
  @Transform(({ value }) => transformOperation(value))
  operation!: BulkUpdateOperation;
}

/**
 * Bulk update result DTO
 */
export class BulkUpdateResultDto {
  @ApiProperty({ description: 'Number of URLs updated' })
  updatedCount!: number;

  @ApiProperty({ description: 'IDs of updated URLs', type: [String] })
  updatedIds!: string[];

  @ApiPropertyOptional({ description: 'Additional message' })
  message?: string;
}
