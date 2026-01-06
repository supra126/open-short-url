import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';
import { PaginationMetaDto } from '@/common/dto/paginated-response.dto';

export class AuditLogUserDto {
  @ApiProperty({ description: 'User ID', type: String })
  id: string;

  @ApiProperty({ description: 'User email', type: String })
  email: string;

  @ApiPropertyOptional({ description: 'User name', type: String, nullable: true })
  name?: string | null;
}

export class AuditLogDto {
  @ApiProperty({ description: 'Audit log ID', type: String })
  id: string;

  @ApiPropertyOptional({
    description: 'User who performed the action',
    type: () => AuditLogUserDto,
    nullable: true,
  })
  user?: AuditLogUserDto | null;

  @ApiProperty({ description: 'Action type', enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ description: 'Entity type', type: String })
  entityType: string;

  @ApiPropertyOptional({ description: 'Entity ID', type: String, nullable: true })
  entityId?: string | null;

  @ApiPropertyOptional({
    description: 'Previous state',
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  oldValue?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'New state',
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  newValue?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'IP address', type: String, nullable: true })
  ipAddress?: string | null;

  @ApiPropertyOptional({ description: 'User agent', type: String, nullable: true })
  userAgent?: string | null;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Timestamp', type: Date })
  createdAt: Date;
}

export class AuditLogListResponseDto extends PaginationMetaDto {
  @ApiProperty({ description: 'Audit logs', type: [AuditLogDto] })
  data: AuditLogDto[];
}
