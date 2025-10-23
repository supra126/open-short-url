import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsHexColor,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBundleDto {
  @ApiProperty({
    description: 'Bundle name',
    example: '2025 Black Friday Campaign',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Bundle name is required' })
  @MinLength(1, { message: 'Bundle name must be at least 1 character' })
  @MaxLength(100, { message: 'Bundle name must be at most 100 characters' })
  name!: string;

  @ApiPropertyOptional({
    description: 'Bundle description',
    example: 'All links for Black Friday marketing campaign',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Bundle color (hex format)',
    example: '#FF5733',
    default: '#3B82F6',
  })
  @IsHexColor({ message: 'Color must be a valid hex color' })
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    description: 'Bundle icon (emoji or icon name)',
    example: '🎯',
    default: '📦',
  })
  @IsString()
  @IsOptional()
  @MaxLength(10, { message: 'Icon must be at most 10 characters' })
  icon?: string;

  @ApiPropertyOptional({
    description: 'URL IDs to add to this bundle',
    example: ['clxxx123456789', 'clxxx987654321'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  urlIds?: string[];
}
