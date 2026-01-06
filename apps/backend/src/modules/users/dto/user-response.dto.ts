import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PaginationMetaDto } from '@/common/dto/paginated-response.dto';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clu1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'User name',
    example: 'John Doe',
  })
  name?: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Whether the account is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether two-factor authentication is enabled',
    example: false,
  })
  twoFactorEnabled: boolean;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-10-18T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-10-18T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class UserListResponseDto extends PaginationMetaDto {
  @ApiProperty({
    description: 'List of users',
    type: [UserResponseDto],
  })
  data!: UserResponseDto[];
}
