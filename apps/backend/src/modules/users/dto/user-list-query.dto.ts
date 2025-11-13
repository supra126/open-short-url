import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '@/common/dto';

export class UserListQueryDto extends PaginationDto {

  @ApiPropertyOptional({
    description: 'Search keyword (searches name or email)',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by account status (true=active, false=inactive)',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}
