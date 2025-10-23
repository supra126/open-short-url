import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'API Key name',
    example: 'Production API Key',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1, { message: 'Name must not be empty' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;

  @ApiPropertyOptional({
    description: 'Expiration time (ISO 8601 format)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString({}, { message: 'Expiration time must be a valid ISO 8601 date' })
  @IsOptional()
  expiresAt?: string;
}
