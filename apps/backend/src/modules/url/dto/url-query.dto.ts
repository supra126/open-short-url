import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '@/common/dto';

export class UrlQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search keyword (searches title and original URL)',
    example: 'example',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Status filter (ACTIVE: Active, INACTIVE: Inactive, EXPIRED: Expired)',
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
    example: 'ACTIVE',
  })
  @IsEnum(['ACTIVE', 'INACTIVE', 'EXPIRED'])
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

  @ApiPropertyOptional({
    description: 'Sort field (createdAt: Creation time, clickCount: Click count, title: Title)',
    enum: ['createdAt', 'clickCount', 'title'],
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction (asc: Ascending, desc: Descending)',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
