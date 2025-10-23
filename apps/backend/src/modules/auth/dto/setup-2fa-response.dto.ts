import { ApiProperty } from '@nestjs/swagger';

export class Setup2FAResponseDto {
  @ApiProperty({
    description: 'QR code data URL for scanning with authenticator app',
    example: 'data:image/png;base64,iVBORw0KG...',
  })
  qrCode!: string;

  @ApiProperty({
    description: 'Secret key for manual entry (base32 encoded)',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret!: string;

  @ApiProperty({
    description: 'Account name to display in authenticator app',
    example: 'user@example.com',
  })
  accountName!: string;
}
