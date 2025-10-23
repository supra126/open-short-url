import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Disable2FADto {
  @ApiProperty({
    description: 'Current password for security verification',
    example: 'myPassword123',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password!: string;

  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code cannot be empty' })
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code!: string;
}
