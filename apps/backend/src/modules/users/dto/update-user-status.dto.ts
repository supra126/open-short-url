import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Account status (true=active, false=inactive)',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
