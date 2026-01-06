import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '@/common/dto/paginated-response.dto';

export class ApiKeyResponseDto {
  @ApiProperty({
    description: 'API Key ID',
    example: 'clkey123456789',
  })
  id!: string;

  @ApiProperty({
    description: 'API Key name',
    example: 'Production API Key',
  })
  name!: string;

  @ApiProperty({
    description: 'API Key prefix (for display, hides full key)',
    example: 'osu_prod_1234...',
  })
  prefix!: string;

  @ApiPropertyOptional({
    description: 'Complete API Key (only returned on creation, store securely)',
    example: 'osu_prod_1234567890abcdefghijklmnopqrstuvwxyz',
  })
  key?: string;

  @ApiPropertyOptional({
    description: 'Last used timestamp (ISO 8601 format)',
    example: '2025-10-15T08:30:00.000Z',
  })
  lastUsedAt?: Date;

  @ApiPropertyOptional({
    description: 'Expiration time (ISO 8601 format)',
    example: '2025-12-31T23:59:59.000Z',
  })
  expiresAt?: Date;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601 format)',
    example: '2025-10-01T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601 format)',
    example: '2025-10-17T09:08:52.000Z',
  })
  updatedAt!: Date;
}

/**
 * Response DTO for API Key creation
 * Contains the full API key (only returned once on creation)
 */
export class CreateApiKeyResponseDto {
  @ApiProperty({
    description: 'API Key ID',
    example: 'clkey123456789',
  })
  id!: string;

  @ApiProperty({
    description: 'API Key name',
    example: 'Production API Key',
  })
  name!: string;

  @ApiProperty({
    description: 'API Key prefix (for display)',
    example: 'osu_prod_1234...',
  })
  prefix!: string;

  @ApiProperty({
    description: 'Complete API Key (store securely, only shown once)',
    example: 'osu_prod_1234567890abcdefghijklmnopqrstuvwxyz',
  })
  key!: string;

  @ApiPropertyOptional({
    description: 'Last used timestamp (always null on creation)',
    example: null,
  })
  lastUsedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Expiration time (ISO 8601 format)',
    example: '2025-12-31T23:59:59.000Z',
  })
  expiresAt?: Date | null;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601 format)',
    example: '2025-10-01T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601 format)',
    example: '2025-10-17T09:08:52.000Z',
  })
  updatedAt!: Date;
}

export class ApiKeyListResponseDto extends PaginationMetaDto {
  @ApiProperty({
    description: 'API Key list',
    type: [ApiKeyResponseDto],
  })
  data!: ApiKeyResponseDto[];
}
