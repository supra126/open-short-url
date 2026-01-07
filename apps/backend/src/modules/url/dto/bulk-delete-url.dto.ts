import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

/**
 * Bulk delete URL DTO
 */
export class BulkDeleteUrlDto {
  @ApiProperty({
    description: 'URL IDs to delete (max 500)',
    type: [String],
    example: ['clxxx1', 'clxxx2', 'clxxx3'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least 1 URL ID is required' })
  @ArrayMaxSize(500, { message: 'Maximum 500 URLs per batch' })
  urlIds!: string[];
}

/**
 * Bulk delete result DTO
 */
export class BulkDeleteResultDto {
  @ApiProperty({ description: 'Number of URLs deleted' })
  deletedCount!: number;

  @ApiProperty({ description: 'IDs of deleted URLs', type: [String] })
  deletedIds!: string[];
}
