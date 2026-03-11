import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOidcProviderDto {
  @ApiProperty({ description: 'Display name', example: 'Google' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'URL-safe identifier',
    example: 'google',
  })
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  @MinLength(1)
  @MaxLength(50)
  slug!: string;

  @ApiProperty({
    description: 'OIDC Discovery URL',
    example: 'https://accounts.google.com/.well-known/openid-configuration',
  })
  @IsUrl({ require_tld: false })
  discoveryUrl!: string;

  @ApiProperty({ description: 'Client ID', example: 'your-client-id' })
  @IsString()
  @MinLength(1)
  clientId!: string;

  @ApiProperty({ description: 'Client Secret', example: 'your-client-secret' })
  @IsString()
  @MinLength(1)
  clientSecret!: string;

  @ApiPropertyOptional({
    description: 'Scopes',
    example: 'openid email profile',
    default: 'openid email profile',
  })
  @IsOptional()
  @IsString()
  scopes?: string;

  @ApiPropertyOptional({ description: 'Whether the provider is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateOidcProviderDto {
  @ApiPropertyOptional({ description: 'Display name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'OIDC Discovery URL' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  discoveryUrl?: string;

  @ApiPropertyOptional({ description: 'Client ID' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  clientId?: string;

  @ApiPropertyOptional({ description: 'Client Secret' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  clientSecret?: string;

  @ApiPropertyOptional({ description: 'Scopes' })
  @IsOptional()
  @IsString()
  scopes?: string;

  @ApiPropertyOptional({ description: 'Whether the provider is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class OidcProviderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  discoveryUrl!: string;

  @ApiProperty()
  clientId!: string;

  @ApiProperty({ description: 'Whether a client secret is configured' })
  hasClientSecret!: boolean;

  @ApiProperty()
  scopes!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class OidcProviderPublicDto {
  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;
}
