import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@/modules/users/dto/user-response.dto';

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
