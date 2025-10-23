import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clusr123456789',
  })
  id!: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Name',
    example: 'John Doe',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Role',
    enum: ['ADMIN', 'USER'],
    example: 'USER',
  })
  role!: string;

  @ApiProperty({
    description: 'Whether two-factor authentication is enabled',
    example: false,
  })
  twoFactorEnabled!: boolean;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601 format)',
    example: '2025-09-15T14:20:30.000Z',
  })
  createdAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token (use in Authorization header for subsequent requests)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  access_token?: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
    required: false,
    example: {
      id: 'clusr123456789',
      email: 'user@example.com',
      name: 'John Doe',
      role: 'USER',
      createdAt: '2025-09-15T14:20:30.000Z',
    },
  })
  user?: UserResponseDto;

  @ApiProperty({
    description: 'Whether 2FA verification is required',
    example: false,
  })
  requires2FA!: boolean;

  @ApiProperty({
    description: 'Temporary token for 2FA verification (only provided when requires2FA is true)',
    example: 'temp_token_abc123',
    required: false,
  })
  tempToken?: string;
}
