import { ApiProperty } from '@nestjs/swagger';
import {
  ConditionType,
  ConditionOperator,
  LogicalOperator,
  DeviceType,
  DayOfWeek,
} from './routing-condition.dto';

/**
 * DTO for exporting ConditionType enum to OpenAPI
 * This is a utility DTO for documentation purposes only
 */
export class ConditionTypeDto {
  @ApiProperty({
    description: 'Condition type enum values',
    enum: ConditionType,
    enumName: 'ConditionType',
    example: ConditionType.COUNTRY,
  })
  type: ConditionType;
}

/**
 * DTO for exporting ConditionOperator enum to OpenAPI
 * This is a utility DTO for documentation purposes only
 */
export class ConditionOperatorDto {
  @ApiProperty({
    description: 'Condition operator enum values',
    enum: ConditionOperator,
    enumName: 'ConditionOperator',
    example: ConditionOperator.EQUALS,
  })
  operator: ConditionOperator;
}

/**
 * DTO for exporting LogicalOperator enum to OpenAPI
 * This is a utility DTO for documentation purposes only
 */
export class LogicalOperatorDto {
  @ApiProperty({
    description: 'Logical operator enum values',
    enum: LogicalOperator,
    enumName: 'LogicalOperator',
    example: LogicalOperator.AND,
  })
  operator: LogicalOperator;
}

/**
 * DTO for exporting DeviceType enum to OpenAPI
 * This is a utility DTO for documentation purposes only
 */
export class DeviceTypeDto {
  @ApiProperty({
    description: 'Device type enum values',
    enum: DeviceType,
    enumName: 'DeviceType',
    example: DeviceType.MOBILE,
  })
  deviceType: DeviceType;
}

/**
 * DTO for exporting DayOfWeek enum to OpenAPI
 * This is a utility DTO for documentation purposes only
 */
export class DayOfWeekDto {
  @ApiProperty({
    description: 'Day of week enum values (0=Sunday, 6=Saturday)',
    enum: DayOfWeek,
    enumName: 'DayOfWeek',
    example: DayOfWeek.MONDAY,
  })
  dayOfWeek: DayOfWeek;
}
