import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class VerifyPasswordDto {
  @ApiProperty({
    description: 'Password',
    example: 'mypassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiProperty({
    description: 'Cloudflare Turnstile token for anti-bot verification (optional, only required if Turnstile is configured)',
    example: '0x4AAAAAAA...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Turnstile token must be a string' })
  turnstileToken?: string;
}
