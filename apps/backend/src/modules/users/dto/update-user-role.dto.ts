import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New user role',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
