import { ApiProperty } from '@nestjs/swagger';

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
