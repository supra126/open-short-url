import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { CreateUrlDto } from './create-url.dto';
import { UrlResponseDto } from './url-response.dto';

/**
 * Bulk create URL DTO
 */
export class BulkCreateUrlDto {
  @ApiProperty({
    description: 'URL list (max 500)',
    type: [CreateUrlDto],
    maxItems: 500,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 URL is required' })
  @ArrayMaxSize(500, { message: 'Maximum 500 URLs per batch' })
  @ValidateNested({ each: true })
  @Type(() => CreateUrlDto)
  urls!: CreateUrlDto[];
}

/**
 * Bulk create success item
 */
export class BulkCreateSuccessItem {
  @ApiProperty({ description: 'Index in the original array' })
  index!: number;

  @ApiProperty({ description: 'Created URL', type: UrlResponseDto })
  url!: UrlResponseDto;
}

/**
 * Bulk create failure item
 */
export class BulkCreateFailureItem {
  @ApiProperty({ description: 'Index in the original array' })
  index!: number;

  @ApiProperty({ description: 'Original input data', type: CreateUrlDto })
  data!: CreateUrlDto;

  @ApiProperty({ description: 'Error message' })
  error!: string;
}

/**
 * Bulk create result DTO
 */
export class BulkCreateResultDto {
  @ApiProperty({ description: 'Total number of URLs in request' })
  total!: number;

  @ApiProperty({ description: 'Number of successfully created URLs' })
  successCount!: number;

  @ApiProperty({ description: 'Number of failed URLs' })
  failureCount!: number;

  @ApiProperty({ description: 'Successfully created URLs', type: [BulkCreateSuccessItem] })
  succeeded!: BulkCreateSuccessItem[];

  @ApiProperty({ description: 'Failed URLs with error details', type: [BulkCreateFailureItem] })
  failed!: BulkCreateFailureItem[];
}
