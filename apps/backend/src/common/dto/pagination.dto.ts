import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
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
