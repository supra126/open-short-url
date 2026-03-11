import { IsString, MaxLength, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserNameDto {
  @ApiPropertyOptional({
    description: 'New user name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name must not be empty' })
  @MaxLength(100)
  @IsOptional()
  name?: string;
}
