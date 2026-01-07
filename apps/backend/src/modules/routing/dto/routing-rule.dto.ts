import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsUrl,
  IsObject,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { RoutingConditionsDto } from './routing-condition.dto';
import { IsSafeUrl } from '@/common/validators/safe-url.validator';

/**
 * DTO for creating a routing rule
 */
export class CreateRoutingRuleDto {
  @ApiProperty({
    description: 'Name of the routing rule',
    example: 'iOS App Store Redirect',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Target URL when conditions match',
    example: 'https://apps.apple.com/app/myapp',
  })
  @IsUrl({}, { message: 'Target URL must be a valid URL' })
  @IsSafeUrl({ message: 'Target URL must be a public URL. Internal network addresses are not allowed.' })
  targetUrl: string;

  @ApiPropertyOptional({
    description: 'Priority of this rule (higher = evaluated first)',
    example: 100,
    minimum: 0,
    maximum: 10000,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Whether this rule is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Conditions for this routing rule',
    type: RoutingConditionsDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => RoutingConditionsDto)
  conditions: RoutingConditionsDto;
}

/**
 * DTO for updating a routing rule
 */
export class UpdateRoutingRuleDto extends PartialType(CreateRoutingRuleDto) {}

/**
 * Response DTO for a routing rule
 */
export class RoutingRuleResponseDto {
  @ApiProperty({ description: 'Unique ID of the routing rule' })
  id: string;

  @ApiProperty({ description: 'URL ID this rule belongs to' })
  urlId: string;

  @ApiProperty({ description: 'Name of the routing rule' })
  name: string;

  @ApiProperty({ description: 'Target URL when conditions match' })
  targetUrl: string;

  @ApiProperty({ description: 'Priority of this rule' })
  priority: number;

  @ApiProperty({ description: 'Whether this rule is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Conditions for this routing rule' })
  conditions: RoutingConditionsDto;

  @ApiProperty({ description: 'Number of times this rule matched' })
  matchCount: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

/**
 * Routing rule statistics DTO for list response
 */
export class RoutingRuleStatDto {
  @ApiProperty({ description: 'Rule ID', example: 'clxxx123456789' })
  ruleId: string;

  @ApiProperty({ description: 'Rule name', example: 'iOS Users' })
  name: string;

  @ApiProperty({ description: 'Number of matches', example: 150 })
  matchCount: number;

  @ApiProperty({ description: 'Match percentage', example: 35.5 })
  matchPercentage: number;
}

/**
 * Response DTO for routing rules list with statistics
 */
export class RoutingRulesListResponseDto {
  @ApiProperty({
    description: 'List of routing rules',
    type: [RoutingRuleResponseDto],
  })
  rules: RoutingRuleResponseDto[];

  @ApiProperty({ description: 'Total number of matches across all rules' })
  totalMatches: number;

  @ApiProperty({
    description: 'Statistics for each rule',
    type: [RoutingRuleStatDto],
  })
  stats: RoutingRuleStatDto[];
}

/**
 * DTO for updating Smart Routing settings on a URL
 */
export class UpdateSmartRoutingSettingsDto {
  @ApiPropertyOptional({
    description: 'Enable or disable smart routing',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isSmartRouting?: boolean;

  @ApiPropertyOptional({
    description: 'Default URL when no routing rules match (optional)',
    example: 'https://example.com/default',
    type: 'string',
    nullable: true,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Default URL must be a valid URL' })
  @IsSafeUrl({ message: 'Default URL must be a public URL. Internal network addresses are not allowed.' })
  defaultUrl?: string | null;
}

/**
 * DTO for creating rule from template
 */
export class CreateFromTemplateDto {
  @ApiProperty({
    description: 'Template key',
    example: 'APP_DOWNLOAD_IOS',
  })
  @IsString()
  templateKey: string;

  @ApiProperty({
    description: 'Target URL for this rule',
    example: 'https://apps.apple.com/app/myapp',
  })
  @IsUrl({}, { message: 'Target URL must be a valid URL' })
  @IsSafeUrl({ message: 'Target URL must be a public URL. Internal network addresses are not allowed.' })
  targetUrl: string;

  @ApiPropertyOptional({
    description: 'Custom name (overrides template name)',
    example: 'iOS - App Store',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Priority of this rule',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  priority?: number;
}

/**
 * Response DTO for smart routing settings
 */
export class SmartRoutingSettingsResponseDto {
  @ApiProperty({ description: 'Whether smart routing is enabled', example: true })
  isSmartRouting: boolean;

  @ApiProperty({
    description: 'Default URL when no routing rules match',
    example: 'https://example.com/default',
    type: 'string',
    nullable: true,
  })
  defaultUrl: string | null;
}

/**
 * Single routing rule template DTO
 */
export class RoutingTemplateDto {
  @ApiProperty({ description: 'Template key', example: 'APP_DOWNLOAD_IOS' })
  key: string;

  @ApiProperty({ description: 'Template name', example: 'iOS App Download' })
  name: string;

  @ApiProperty({
    description: 'Template description',
    example: 'Redirect iOS users to App Store',
  })
  description: string;

  @ApiProperty({
    description: 'Template conditions',
    type: RoutingConditionsDto,
  })
  conditions: RoutingConditionsDto;
}

/**
 * Response for available templates
 */
export class TemplateListResponseDto {
  @ApiProperty({
    description: 'Available routing rule templates',
    type: [RoutingTemplateDto],
  })
  templates: RoutingTemplateDto[];
}
