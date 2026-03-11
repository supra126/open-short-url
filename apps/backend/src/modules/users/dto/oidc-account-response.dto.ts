import { ApiProperty } from '@nestjs/swagger';

export class OidcAccountProviderDto {
  @ApiProperty({ description: 'Provider display name', example: 'Google' })
  name!: string;

  @ApiProperty({ description: 'Provider slug', example: 'google' })
  slug!: string;
}

export class OidcAccountResponseDto {
  @ApiProperty({ description: 'OIDC account link ID' })
  id!: string;

  @ApiProperty({ description: 'OIDC provider ID' })
  providerId!: string;

  @ApiProperty({ description: 'OIDC subject identifier' })
  sub!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Provider information', type: OidcAccountProviderDto })
  provider!: OidcAccountProviderDto;
}
