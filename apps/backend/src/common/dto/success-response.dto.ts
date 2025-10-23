import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard success response DTO
 */
export class SuccessResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Operation completed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;
}
