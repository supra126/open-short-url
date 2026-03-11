import { ApiProperty } from '@nestjs/swagger';

/**
 * Base class for pagination metadata.
 * All ListResponseDto classes should extend this class.
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of records', example: 100 })
  total!: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Number of records per page', example: 10 })
  pageSize!: number;

  @ApiProperty({ description: 'Total number of pages', example: 10 })
  totalPages!: number;
}

/**
 * Helper to build a paginated response object.
 * Use this in services to avoid duplicating Math.ceil(total / pageSize).
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
