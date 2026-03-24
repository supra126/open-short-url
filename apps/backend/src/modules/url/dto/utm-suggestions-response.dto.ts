import { ApiProperty } from '@nestjs/swagger';

export class UtmSuggestionItemDto {
  @ApiProperty({
    description: 'The UTM value',
    example: 'facebook',
  })
  value!: string;

  @ApiProperty({
    description: 'Number of URLs using this value',
    example: 12,
  })
  count!: number;
}

export class UtmSuggestionsResponseDto {
  @ApiProperty({
    description: 'The UTM field name',
    example: 'utmSource',
  })
  field!: string;

  @ApiProperty({
    description: 'List of suggestions with usage count, sorted by popularity',
    type: [UtmSuggestionItemDto],
  })
  suggestions!: UtmSuggestionItemDto[];
}
