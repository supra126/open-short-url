import { Injectable, Logger } from '@nestjs/common';
import {
  ConditionType,
  ConditionOperator,
  LogicalOperator,
  RoutingConditionsDto,
  ConditionItemDto,
  VisitorContext,
} from './dto/routing-condition.dto';

/**
 * Time range structure for time-based conditions
 */
interface TimeRange {
  start: string; // HH:mm format
  end: string; // HH:mm format
  timezone?: string;
}

/**
 * Service for evaluating routing conditions against visitor context
 */
@Injectable()
export class RoutingEvaluatorService {
  private readonly logger = new Logger(RoutingEvaluatorService.name);

  /**
   * Evaluate routing conditions against visitor context
   * @param conditions Routing conditions structure
   * @param context Visitor context data
   * @returns true if conditions match, false otherwise
   */
  evaluate(conditions: RoutingConditionsDto, context: VisitorContext): boolean {
    if (!conditions?.conditions || conditions.conditions.length === 0) {
      return false;
    }

    const results = conditions.conditions.map((condition) =>
      this.evaluateCondition(condition, context),
    );

    if (conditions.operator === LogicalOperator.AND) {
      return results.every((result) => result);
    } else {
      // OR
      return results.some((result) => result);
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: ConditionItemDto,
    context: VisitorContext,
  ): boolean {
    try {
      const contextValue = this.getContextValue(condition.type, context);

      // Handle time-based conditions specially
      if (condition.type === ConditionType.TIME) {
        return this.evaluateTimeCondition(condition, context);
      }

      if (condition.type === ConditionType.DAY_OF_WEEK) {
        return this.evaluateDayOfWeekCondition(condition, context);
      }

      // For other conditions, compare values
      return this.compareValues(
        contextValue,
        condition.operator,
        condition.value,
      );
    } catch (error) {
      this.logger.warn(
        `Error evaluating condition ${condition.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Get value from visitor context based on condition type
   */
  private getContextValue(
    type: ConditionType,
    context: VisitorContext,
  ): string | undefined {
    switch (type) {
      case ConditionType.COUNTRY:
        return context.country?.toUpperCase();
      case ConditionType.REGION:
        return context.region;
      case ConditionType.CITY:
        return context.city;
      case ConditionType.DEVICE:
        return context.device?.toLowerCase();
      case ConditionType.OS:
        return context.os;
      case ConditionType.BROWSER:
        return context.browser;
      case ConditionType.LANGUAGE:
        return context.language;
      case ConditionType.REFERER:
        return context.referer;
      case ConditionType.UTM_SOURCE:
        return context.utmSource;
      case ConditionType.UTM_MEDIUM:
        return context.utmMedium;
      case ConditionType.UTM_CAMPAIGN:
        return context.utmCampaign;
      case ConditionType.UTM_TERM:
        return context.utmTerm;
      case ConditionType.UTM_CONTENT:
        return context.utmContent;
      default:
        return undefined;
    }
  }

  /**
   * Compare context value against condition value using operator
   */
  private compareValues(
    contextValue: string | undefined,
    operator: ConditionOperator,
    conditionValue: string | string[] | TimeRange,
  ): boolean {
    // Handle undefined context value
    if (contextValue === undefined || contextValue === null) {
      // NOT_EQUALS and NOT_IN should return true when context value is undefined
      if (operator === ConditionOperator.NOT_EQUALS || operator === ConditionOperator.NOT_IN) {
        return true;
      }
      return false;
    }

    const normalizedContextValue = contextValue.toLowerCase();

    switch (operator) {
      case ConditionOperator.EQUALS:
        return this.normalizeValue(conditionValue as string) === normalizedContextValue;

      case ConditionOperator.NOT_EQUALS:
        return this.normalizeValue(conditionValue as string) !== normalizedContextValue;

      case ConditionOperator.CONTAINS:
        return normalizedContextValue.includes(
          this.normalizeValue(conditionValue as string),
        );

      case ConditionOperator.NOT_CONTAINS:
        return !normalizedContextValue.includes(
          this.normalizeValue(conditionValue as string),
        );

      case ConditionOperator.IN:
        const inValues = Array.isArray(conditionValue)
          ? conditionValue
          : [conditionValue as string];
        // Empty array is invalid - treat as no match
        if (inValues.length === 0) {
          return false;
        }
        return inValues.some(
          (v) => this.normalizeValue(v) === normalizedContextValue,
        );

      case ConditionOperator.NOT_IN:
        const notInValues = Array.isArray(conditionValue)
          ? conditionValue
          : [conditionValue as string];
        // Empty array is invalid - treat as no match (not "match all")
        if (notInValues.length === 0) {
          return false;
        }
        return !notInValues.some(
          (v) => this.normalizeValue(v) === normalizedContextValue,
        );

      case ConditionOperator.STARTS_WITH:
        return normalizedContextValue.startsWith(
          this.normalizeValue(conditionValue as string),
        );

      case ConditionOperator.ENDS_WITH:
        return normalizedContextValue.endsWith(
          this.normalizeValue(conditionValue as string),
        );

      default:
        return false;
    }
  }

  /**
   * Normalize value for case-insensitive comparison
   */
  private normalizeValue(value: string): string {
    return (value || '').toLowerCase().trim();
  }

  /**
   * Evaluate time-based condition
   */
  private evaluateTimeCondition(
    condition: ConditionItemDto,
    context: VisitorContext,
  ): boolean {
    const timeRange = condition.value as TimeRange;
    if (!timeRange || !timeRange.start) {
      return false;
    }

    // BETWEEN operator requires both start and end
    if (condition.operator === ConditionOperator.BETWEEN && !timeRange.end) {
      this.logger.warn('BETWEEN operator requires both start and end time');
      return false;
    }

    const currentTime = context.currentTime || new Date();
    const timezone = timeRange.timezone || context.timezone || 'UTC';

    try {
      // Get current time in the specified timezone
      const timeString = currentTime.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      const currentMinutes = this.parseTimeToMinutes(timeString);
      const startMinutes = this.parseTimeToMinutes(timeRange.start);

      switch (condition.operator) {
        case ConditionOperator.BETWEEN:
          // end is guaranteed to exist here due to check above
          const endMinutes = this.parseTimeToMinutes(timeRange.end!);
          // Handle overnight ranges (e.g., 22:00 - 06:00)
          if (startMinutes <= endMinutes) {
            return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
          } else {
            return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
          }

        case ConditionOperator.BEFORE:
          // Before the specified start time
          return currentMinutes < startMinutes;

        case ConditionOperator.AFTER:
          // After the specified start time
          return currentMinutes > startMinutes;

        default:
          return false;
      }
    } catch (error) {
      this.logger.warn(
        `Error evaluating time condition: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Evaluate day of week condition
   */
  private evaluateDayOfWeekCondition(
    condition: ConditionItemDto,
    context: VisitorContext,
  ): boolean {
    const currentTime = context.currentTime || new Date();
    const timezone = context.timezone || 'UTC';

    try {
      // Get day of week in the specified timezone (0 = Sunday, 6 = Saturday)
      const dayString = currentTime.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'short',
      });

      const dayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
      };

      const currentDay = dayMap[dayString] ?? -1;
      if (currentDay === -1) {
        return false;
      }

      const conditionDays = Array.isArray(condition.value)
        ? condition.value.map((d) => parseInt(d, 10))
        : [parseInt(condition.value as string, 10)];

      switch (condition.operator) {
        case ConditionOperator.IN:
        case ConditionOperator.EQUALS:
          return conditionDays.includes(currentDay);

        case ConditionOperator.NOT_IN:
        case ConditionOperator.NOT_EQUALS:
          return !conditionDays.includes(currentDay);

        default:
          return false;
      }
    } catch (error) {
      this.logger.warn(
        `Error evaluating day of week condition: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Parse time string (HH:mm) to minutes since midnight
   */
  private parseTimeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map((n) => parseInt(n, 10));
    return hours * 60 + minutes;
  }

  /**
   * Build visitor context from raw click data
   */
  buildVisitorContext(data: {
    ip?: string;
    userAgent?: string;
    referer?: string;
    language?: string;
    country?: string;
    region?: string;
    city?: string;
    device?: string;
    os?: string;
    browser?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    timezone?: string;
  }): VisitorContext {
    return {
      country: data.country,
      region: data.region,
      city: data.city,
      device: data.device,
      os: data.os,
      browser: data.browser,
      language: data.language,
      referer: data.referer,
      currentTime: new Date(),
      timezone: data.timezone || 'UTC',
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      utmTerm: data.utmTerm,
      utmContent: data.utmContent,
    };
  }
}
