import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';
import { PaginationMetaDto } from '@/common/dto/paginated-response.dto';

export class AuditLogUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiPropertyOptional({ description: 'User name' })
  name?: string | null;
}

export class AuditLogDto {
  @ApiProperty({ description: 'Audit log ID' })
  id: string;

  @ApiPropertyOptional({ description: 'User who performed the action' })
  user?: AuditLogUserDto | null;

  @ApiProperty({ description: 'Action type', enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ description: 'Entity type' })
  entityType: string;

  @ApiPropertyOptional({ description: 'Entity ID' })
  entityId?: string | null;

  @ApiPropertyOptional({ description: 'Previous state' })
  oldValue?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'New state' })
  newValue?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'IP address' })
  ipAddress?: string | null;

  @ApiPropertyOptional({ description: 'User agent' })
  userAgent?: string | null;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Timestamp' })
  createdAt: Date;
}

export class AuditLogListResponseDto extends PaginationMetaDto {
  @ApiProperty({ description: 'Audit logs', type: [AuditLogDto] })
  data: AuditLogDto[];
}
