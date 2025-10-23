import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BundleStatus } from '@prisma/client';

export class BundleQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by bundle status',
    enum: BundleStatus,
    example: BundleStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(BundleStatus)
  status?: BundleStatus;

  @ApiPropertyOptional({
    description: 'Search by bundle name or description',
    example: 'Black Friday',
  })
  @IsOptional()
  search?: string;
}
