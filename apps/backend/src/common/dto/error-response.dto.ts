import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed',
  })
  message!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Timestamp (ISO 8601 format)',
    example: '2025-10-17T09:08:52.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Request path',
    example: '/api/urls',
    required: false,
  })
  path?: string;

  constructor(
    message: string,
    statusCode: number,
    path?: string
  ) {
    this.message = message;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}
