import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email address',
    example: 'admin@example.com',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiPropertyOptional({
    description: '6-digit 2FA verification code (required if 2FA is enabled)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: 'Code must be a string' })
  @IsOptional()
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  twoFactorCode?: string;

  @ApiPropertyOptional({
    description: 'Cloudflare Turnstile token for anti-bot verification (optional, required only if Turnstile is enabled)',
    example: '0x4AAAAAAA...',
  })
  @IsString({ message: 'Turnstile token must be a string' })
  @IsOptional()
  turnstileToken?: string;
}
