import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * Maximum page number allowed to prevent extremely large offset calculations
 * 10000 pages * 100 items = 1M max offset, which is reasonable for most use cases
 */
export const MAX_PAGE_NUMBER = 10000;

export class PaginationDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_PAGE_NUMBER,
    default: 1,
    description: `Page number (starts from 1, maximum ${MAX_PAGE_NUMBER})`,
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_NUMBER, { message: `Page number cannot exceed ${MAX_PAGE_NUMBER}` })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 10,
    description: 'Number of records per page (maximum 100)',
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 10;
}
