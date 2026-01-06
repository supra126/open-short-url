import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';

export class SystemSettingsDto {
  @ApiPropertyOptional({
    description: 'Whether to allow user registration',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  allowRegistration?: boolean;

  @ApiPropertyOptional({
    description: 'Default slug length for short URLs',
    example: 8,
    minimum: 4,
    maximum: 20,
  })
  @IsInt()
  @Min(4)
  @Max(20)
  @IsOptional()
  defaultSlugLength?: number;

  @ApiPropertyOptional({
    description: 'Whether email verification is required',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  requireEmailVerification?: boolean;

  @ApiPropertyOptional({
    description: 'Whether analytics is enabled',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  enableAnalytics?: boolean;
}

export class SystemSettingsResponseDto {
  @ApiProperty({
    description: 'Setting ID',
    example: 'clset123456789',
  })
  id!: string;

  @ApiProperty({
    description: 'Setting key (unique identifier)',
    example: 'allow_registration',
  })
  key!: string;

  @ApiProperty({
    description: 'Setting value (can be any type: string, number, boolean, object)',
    example: true,
  })
  value!: unknown;

  @ApiProperty({
    description: 'Setting description',
    example: 'Whether to allow new user registration',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601 format)',
    example: '2025-09-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601 format)',
    example: '2025-10-17T09:08:52.000Z',
  })
  updatedAt!: Date;
}
