import {
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsOptional,
  Matches,
  ArrayMinSize,
  ArrayMaxSize,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidTimezone } from '@/common/validators/timezone.validator';

/**
 * Time format regex: HH:mm (00:00 to 23:59)
 */
const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Custom validator for condition value
 * Validates based on condition type
 */
function IsValidConditionValue(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidConditionValue',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const obj = args.object as { type?: ConditionType; operator?: ConditionOperator };

          // Time condition validation
          if (obj.type === ConditionType.TIME) {
            if (typeof value === 'object' && value !== null) {
              const timeRange = value as { start?: string; end?: string };
              if (!timeRange.start || !TIME_FORMAT_REGEX.test(timeRange.start)) {
                return false;
              }
              if (timeRange.end && !TIME_FORMAT_REGEX.test(timeRange.end)) {
                return false;
              }
              return true;
            }
            return false;
          }

          // Day of week validation (must be 0-6 or array of 0-6)
          if (obj.type === ConditionType.DAY_OF_WEEK) {
            if (Array.isArray(value)) {
              return value.every((v) => {
                const num = parseInt(String(v), 10);
                return !isNaN(num) && num >= 0 && num <= 6;
              });
            }
            const num = parseInt(String(value), 10);
            return !isNaN(num) && num >= 0 && num <= 6;
          }

          // IN/NOT_IN operators require non-empty arrays or strings
          if (obj.operator === ConditionOperator.IN || obj.operator === ConditionOperator.NOT_IN) {
            if (Array.isArray(value)) {
              return value.length > 0;
            }
            return typeof value === 'string' && value.length > 0;
          }

          // Default: string or array of strings
          if (Array.isArray(value)) {
            return value.every((v) => typeof v === 'string');
          }
          return typeof value === 'string';
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as { type?: ConditionType; operator?: ConditionOperator };

          if (obj.type === ConditionType.TIME) {
            return 'Time value must be an object with start (and optionally end) in HH:mm format';
          }
          if (obj.type === ConditionType.DAY_OF_WEEK) {
            return 'Day of week value must be a number 0-6 or array of numbers 0-6';
          }
          if (obj.operator === ConditionOperator.IN || obj.operator === ConditionOperator.NOT_IN) {
            return 'IN/NOT_IN operators require a non-empty array or string value';
          }
          return 'Invalid condition value';
        },
      },
    });
  };
}

/**
 * Time range DTO for time-based conditions
 */
export class TimeRangeDto {
  @ApiProperty({
    description: 'Start time in HH:mm format',
    example: '09:00',
  })
  @IsString()
  @Matches(TIME_FORMAT_REGEX, { message: 'Start time must be in HH:mm format (00:00-23:59)' })
  start: string;

  @ApiPropertyOptional({
    description: 'End time in HH:mm format',
    example: '18:00',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT_REGEX, { message: 'End time must be in HH:mm format (00:00-23:59)' })
  end?: string;

  @ApiPropertyOptional({
    description: 'Timezone (IANA format)',
    example: 'Asia/Taipei',
  })
  @IsOptional()
  @IsString()
  @IsValidTimezone({ message: 'Timezone must be a valid IANA timezone (e.g., Asia/Taipei, America/New_York, UTC)' })
  timezone?: string;
}

/**
 * Condition types for smart routing
 */
export enum ConditionType {
  // Geographic
  COUNTRY = 'country',
  REGION = 'region',
  CITY = 'city',
  // Device & Browser
  DEVICE = 'device',
  OS = 'os',
  BROWSER = 'browser',
  // User preferences
  LANGUAGE = 'language',
  // Traffic source
  REFERER = 'referer',
  // Time-based
  TIME = 'time',
  DAY_OF_WEEK = 'day_of_week',
  // UTM Parameters
  UTM_SOURCE = 'utm_source',
  UTM_MEDIUM = 'utm_medium',
  UTM_CAMPAIGN = 'utm_campaign',
  UTM_TERM = 'utm_term',
  UTM_CONTENT = 'utm_content',
}

/**
 * Operators for condition matching
 */
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  IN = 'in',
  NOT_IN = 'not_in',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  // Time-specific operators
  BETWEEN = 'between',
  BEFORE = 'before',
  AFTER = 'after',
}

/**
 * Logical operators for combining conditions
 */
export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
}

/**
 * Device type values
 */
export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

/**
 * Day of week values
 */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

/**
 * Single condition item
 */
export class ConditionItemDto {
  @ApiProperty({
    enum: ConditionType,
    description: 'Type of condition',
    example: ConditionType.COUNTRY,
  })
  @IsEnum(ConditionType)
  type: ConditionType;

  @ApiProperty({
    enum: ConditionOperator,
    description: 'Operator for matching',
    example: ConditionOperator.EQUALS,
  })
  @IsEnum(ConditionOperator)
  operator: ConditionOperator;

  @ApiProperty({
    description: 'Value(s) to match against. Can be string, array, or time range object.',
    oneOf: [
      { type: 'string', example: 'TW' },
      { type: 'array', items: { type: 'string' }, example: ['TW', 'JP', 'KR'] },
      {
        type: 'object',
        properties: {
          start: { type: 'string', example: '09:00' },
          end: { type: 'string', example: '18:00' },
          timezone: { type: 'string', example: 'Asia/Taipei' },
        },
      },
    ],
  })
  @IsValidConditionValue()
  value: string | string[] | { start: string; end: string; timezone?: string };
}

/**
 * Conditions structure with logical operator
 */
export class RoutingConditionsDto {
  @ApiProperty({
    enum: LogicalOperator,
    description: 'Logical operator for combining conditions',
    example: LogicalOperator.AND,
  })
  @IsEnum(LogicalOperator)
  operator: LogicalOperator;

  @ApiProperty({
    type: [ConditionItemDto],
    description: 'Array of condition items (max 20)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20, { message: 'Maximum of 20 conditions per rule allowed' })
  @ValidateNested({ each: true })
  @Type(() => ConditionItemDto)
  conditions: ConditionItemDto[];
}

/**
 * Visitor context for condition evaluation
 */
export interface VisitorContext {
  // Geographic
  country?: string;
  region?: string;
  city?: string;
  // Device & Browser
  device?: string;
  os?: string;
  browser?: string;
  // User preferences
  language?: string;
  // Traffic source
  referer?: string;
  // Current time
  currentTime?: Date;
  timezone?: string;
  // UTM parameters
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

/**
 * Routing rule templates
 */
export interface RoutingRuleTemplate {
  name: string;
  description: string;
  conditions: RoutingConditionsDto;
}

/**
 * Predefined routing rule templates
 */
export const ROUTING_RULE_TEMPLATES: Record<string, RoutingRuleTemplate> = {
  APP_DOWNLOAD_IOS: {
    name: 'iOS App Download',
    description: 'Redirect iOS users to App Store',
    conditions: {
      operator: LogicalOperator.AND,
      conditions: [
        { type: ConditionType.OS, operator: ConditionOperator.EQUALS, value: 'iOS' },
      ],
    },
  },
  APP_DOWNLOAD_ANDROID: {
    name: 'Android App Download',
    description: 'Redirect Android users to Google Play',
    conditions: {
      operator: LogicalOperator.AND,
      conditions: [
        { type: ConditionType.OS, operator: ConditionOperator.EQUALS, value: 'Android' },
      ],
    },
  },
  MULTILANG_TW: {
    name: 'Traditional Chinese Users',
    description: 'Redirect users preferring Traditional Chinese',
    conditions: {
      operator: LogicalOperator.OR,
      conditions: [
        { type: ConditionType.LANGUAGE, operator: ConditionOperator.CONTAINS, value: 'zh-TW' },
        { type: ConditionType.LANGUAGE, operator: ConditionOperator.CONTAINS, value: 'zh-Hant' },
        { type: ConditionType.COUNTRY, operator: ConditionOperator.EQUALS, value: 'TW' },
      ],
    },
  },
  MULTILANG_CN: {
    name: 'Simplified Chinese Users',
    description: 'Redirect users preferring Simplified Chinese',
    conditions: {
      operator: LogicalOperator.OR,
      conditions: [
        { type: ConditionType.LANGUAGE, operator: ConditionOperator.CONTAINS, value: 'zh-CN' },
        { type: ConditionType.LANGUAGE, operator: ConditionOperator.CONTAINS, value: 'zh-Hans' },
        { type: ConditionType.COUNTRY, operator: ConditionOperator.EQUALS, value: 'CN' },
      ],
    },
  },
  BUSINESS_HOURS: {
    name: 'Business Hours',
    description: 'Redirect during business hours (9:00-18:00)',
    conditions: {
      operator: LogicalOperator.AND,
      conditions: [
        {
          type: ConditionType.TIME,
          operator: ConditionOperator.BETWEEN,
          value: { start: '09:00', end: '18:00' },
        },
        {
          type: ConditionType.DAY_OF_WEEK,
          operator: ConditionOperator.IN,
          value: ['1', '2', '3', '4', '5'], // Monday to Friday
        },
      ],
    },
  },
  MOBILE_ONLY: {
    name: 'Mobile Users',
    description: 'Redirect mobile device users',
    conditions: {
      operator: LogicalOperator.AND,
      conditions: [
        { type: ConditionType.DEVICE, operator: ConditionOperator.EQUALS, value: DeviceType.MOBILE },
      ],
    },
  },
  DESKTOP_ONLY: {
    name: 'Desktop Users',
    description: 'Redirect desktop users',
    conditions: {
      operator: LogicalOperator.AND,
      conditions: [
        { type: ConditionType.DEVICE, operator: ConditionOperator.EQUALS, value: DeviceType.DESKTOP },
      ],
    },
  },
};
