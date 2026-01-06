import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for redirect info endpoint
 */
export class RedirectInfoResponseDto {
  @ApiProperty({
    description: 'Whether the short URL requires password verification',
    example: true,
  })
  requiresPassword!: boolean;
}

/**
 * Response DTO for password verification endpoint
 */
export class VerifyPasswordResponseDto {
  @ApiProperty({
    description: 'The original URL to redirect to after password verification',
    example: 'https://example.com/target-page',
  })
  originalUrl!: string;
}
