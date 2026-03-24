import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const UTM_FIELDS = [
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmTerm',
  'utmContent',
  'utmId',
  'utmSourcePlatform',
] as const;

export type UtmFieldName = (typeof UTM_FIELDS)[number];

export class UtmSuggestionsQueryDto {
  @ApiProperty({
    description: 'UTM field name to get suggestions for',
    enum: UTM_FIELDS,
    example: 'utmSource',
  })
  @IsIn(UTM_FIELDS, {
    message:
      'field must be one of: utmSource, utmMedium, utmCampaign, utmTerm, utmContent, utmId, utmSourcePlatform',
  })
  field!: UtmFieldName;

  @ApiPropertyOptional({
    description: 'Search prefix to filter suggestions',
    maxLength: 100,
    example: 'news',
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  q?: string;
}
