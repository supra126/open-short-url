import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsHexColor,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BundleStatus } from '@prisma/client';

export class UpdateBundleDto {
  @ApiPropertyOptional({
    description: 'Bundle name',
    example: '2025 Black Friday Campaign',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1, { message: 'Bundle name must be at least 1 character' })
  @MaxLength(100, { message: 'Bundle name must be at most 100 characters' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Bundle description',
    example: 'All links for Black Friday marketing campaign',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Bundle color (hex format)',
    example: '#FF5733',
  })
  @IsHexColor({ message: 'Color must be a valid hex color' })
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    description: 'Bundle icon (emoji or icon name)',
    example: '🎯',
  })
  @IsString()
  @MaxLength(10, { message: 'Icon must be at most 10 characters' })
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Bundle status',
    enum: BundleStatus,
    example: BundleStatus.ACTIVE,
  })
  @IsEnum(BundleStatus, { message: 'Invalid bundle status' })
  @IsOptional()
  status?: BundleStatus;
}
