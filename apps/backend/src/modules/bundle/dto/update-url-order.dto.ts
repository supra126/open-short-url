import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateUrlOrderDto {
  @ApiProperty({
    description: 'New display order for the URL within the bundle',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  order!: number;
}
