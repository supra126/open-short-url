import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { AnalyticsQueryDto } from './analytics-query.dto';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
}

export class ExportQueryDto extends AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Export format (csv or json)',
    enum: ExportFormat,
    default: ExportFormat.CSV,
    example: 'csv',
  })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat = ExportFormat.CSV;

  @ApiPropertyOptional({
    description: 'Include detailed click records (default: false)',
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeClicks?: boolean = false;
}
