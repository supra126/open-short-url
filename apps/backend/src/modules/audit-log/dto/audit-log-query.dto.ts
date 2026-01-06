import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { AuditAction } from '@prisma/client';
import { PaginationDto } from '@/common/dto';

export class AuditLogQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by action type',
    enum: AuditAction,
    example: 'URL_CREATED',
  })
  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Filter by entity type (url, user, api_key, bundle, webhook, variant)',
    example: 'url',
  })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity ID',
    example: 'clxxx123456789',
  })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'clxxx123456789',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO 8601 format)',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO 8601 format)',
    example: '2025-01-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Sort order (asc or desc)',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'asc' ? 'asc' : 'desc')
  sortOrder?: 'asc' | 'desc' = 'desc';
}
