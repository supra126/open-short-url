import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class AddUrlToBundleDto {
  @ApiProperty({
    description: 'URL ID to add to bundle',
    example: 'clxxx123456789',
  })
  @IsString()
  @IsNotEmpty({ message: 'URL ID is required' })
  urlId!: string;

  @ApiPropertyOptional({
    description: 'Display order within the bundle',
    example: 0,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class AddMultipleUrlsDto {
  @ApiProperty({
    description: 'URL IDs to add to bundle',
    example: ['clxxx123456789', 'clxxx987654321'],
    type: [String],
  })
  @IsString({ each: true })
  @IsNotEmpty({ message: 'URL IDs are required' })
  urlIds!: string[];
}
