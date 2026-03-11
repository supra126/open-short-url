import { ApiProperty } from '@nestjs/swagger';

export class QrCodeResponseDto {
  @ApiProperty({ description: 'Base64 encoded QR Code Data URL', example: 'data:image/png;base64,...' })
  qrCode: string;
}
