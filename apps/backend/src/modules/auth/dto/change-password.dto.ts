import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'oldPassword123',
  })
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password cannot be empty' })
  oldPassword!: string;

  @ApiProperty({
    description: 'New password',
    example: 'newPassword123',
    minLength: 8,
  })
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password cannot be empty' })
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  newPassword!: string;
}
