import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { BundleStatus } from '@prisma/client';
import { PaginationDto } from '@/common/dto';

export class BundleQueryDto extends PaginationDto {

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
