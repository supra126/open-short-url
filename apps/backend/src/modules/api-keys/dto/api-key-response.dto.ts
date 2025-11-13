import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({
    description: 'Complete API Key (only returned once on creation, store securely)',
    example: 'osu_prod_1234567890abcdefghijklmnopqrstuvwxyz',
    required: false,
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

export class ApiKeyListResponseDto {
  @ApiProperty({
    description: 'API Key list',
    type: [ApiKeyResponseDto],
    example: [
      {
        id: 'clkey123456789',
        name: 'Production API Key',
        prefix: 'osu_prod_1234...',
        lastUsedAt: '2025-10-15T08:30:00.000Z',
        createdAt: '2025-10-01T10:00:00.000Z',
        updatedAt: '2025-10-17T09:08:52.000Z',
      },
    ],
  })
  data!: ApiKeyResponseDto[];

  @ApiProperty({
    description: 'Total number of records',
    example: 3,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  pageSize!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 1,
  })
  totalPages!: number;
}
