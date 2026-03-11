import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSystemSettingDto {
  @ApiProperty({
    description: 'Setting value (can be any type: string, number, boolean, object)',
    example: true,
  })
  @IsDefined({ message: 'value is required' })
  value!: unknown;

  @ApiPropertyOptional({
    description: 'Setting description',
    example: 'Whether to allow new user registration',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
