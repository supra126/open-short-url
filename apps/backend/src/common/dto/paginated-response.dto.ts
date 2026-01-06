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

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Data list', type: 'array' })
  data!: T[];

  @ApiProperty({ description: 'Total number of records' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Number of records per page' })
  pageSize!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;

  constructor(
    data: T[],
    total: number,
    page: number,
    pageSize: number
  ) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
  }
}
