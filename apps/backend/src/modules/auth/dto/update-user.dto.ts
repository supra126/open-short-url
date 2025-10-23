import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Name',
    example: 'John Doe',
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;
}
