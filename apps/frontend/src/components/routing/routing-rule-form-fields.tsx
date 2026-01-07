'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t, type TranslationKey } from '@/lib/i18n';
import { Plus, X } from 'lucide-react';
import type {
  ConditionItemDto,
  ConditionType,
  ConditionOperator,
  LogicalOperator,
} from '@/hooks/use-routing-rules';

// Condition type options
const CONDITION_TYPES: { value: ConditionType; label: string }[] = [
  { value: 'country', label: 'routing.conditionTypes.country' },
  { value: 'region', label: 'routing.conditionTypes.region' },
  { value: 'city', label: 'routing.conditionTypes.city' },
  { value: 'device', label: 'routing.conditionTypes.device' },
  { value: 'os', label: 'routing.conditionTypes.os' },
  { value: 'browser', label: 'routing.conditionTypes.browser' },
  { value: 'language', label: 'routing.conditionTypes.language' },
  { value: 'referer', label: 'routing.conditionTypes.referer' },
  { value: 'utm_source', label: 'routing.conditionTypes.utm_source' },
  { value: 'utm_medium', label: 'routing.conditionTypes.utm_medium' },
  { value: 'utm_campaign', label: 'routing.conditionTypes.utm_campaign' },
  { value: 'time', label: 'routing.conditionTypes.time' },
  { value: 'day_of_week', label: 'routing.conditionTypes.day_of_week' },
];

// Condition operators
const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'routing.operators.equals' },
  { value: 'not_equals', label: 'routing.operators.not_equals' },
  { value: 'contains', label: 'routing.operators.contains' },
  { value: 'not_contains', label: 'routing.operators.not_contains' },
  { value: 'starts_with', label: 'routing.operators.starts_with' },
  { value: 'ends_with', label: 'routing.operators.ends_with' },
  { value: 'in', label: 'routing.operators.in' },
  { value: 'not_in', label: 'routing.operators.not_in' },
  { value: 'between', label: 'routing.operators.between' },
  { value: 'before', label: 'routing.operators.before' },
  { value: 'after', label: 'routing.operators.after' },
];

// Device options
const DEVICE_OPTIONS = [
  { value: 'mobile', label: 'routing.devices.mobile' },
  { value: 'tablet', label: 'routing.devices.tablet' },
  { value: 'desktop', label: 'routing.devices.desktop' },
];

// OS options (common operating systems)
const OS_OPTIONS = [
  { value: 'Windows', label: 'routing.os.windows' },
  { value: 'macOS', label: 'routing.os.macos' },
  { value: 'Linux', label: 'routing.os.linux' },
  { value: 'iOS', label: 'routing.os.ios' },
  { value: 'Android', label: 'routing.os.android' },
  { value: 'Chrome OS', label: 'routing.os.chromeos' },
];

// Browser options (common browsers)
const BROWSER_OPTIONS = [
  { value: 'Chrome', label: 'routing.browsers.chrome' },
  { value: 'Safari', label: 'routing.browsers.safari' },
  { value: 'Firefox', label: 'routing.browsers.firefox' },
  { value: 'Edge', label: 'routing.browsers.edge' },
  { value: 'Opera', label: 'routing.browsers.opera' },
  { value: 'Samsung Browser', label: 'routing.browsers.samsung' },
];

// Day of week options (0=Sunday, 6=Saturday)
const DAY_OPTIONS = [
  { value: '0', label: 'routing.days.sunday' },
  { value: '1', label: 'routing.days.monday' },
  { value: '2', label: 'routing.days.tuesday' },
  { value: '3', label: 'routing.days.wednesday' },
  { value: '4', label: 'routing.days.thursday' },
  { value: '5', label: 'routing.days.friday' },
  { value: '6', label: 'routing.days.saturday' },
];

export interface RoutingRuleFormFieldsProps {
  /** Prefix for input IDs (for accessibility) */
  idPrefix?: string;
  /** Form values */
  name: string;
  targetUrl: string;
  priority: number;
  isActive: boolean;
  logicOp: LogicalOperator;
  conditions: ConditionItemDto[];
  /** Callbacks */
  onNameChange: (value: string) => void;
  onTargetUrlChange: (value: string) => void;
  onPriorityChange: (value: number) => void;
  onIsActiveChange: (value: boolean) => void;
  onLogicOpChange: (value: LogicalOperator) => void;
  onConditionsChange: (conditions: ConditionItemDto[]) => void;
  /** Whether to show the logic hint text */
  showLogicHint?: boolean;
}

export function RoutingRuleFormFields({
  idPrefix = '',
  name,
  targetUrl,
  priority,
  isActive,
  logicOp,
  conditions,
  onNameChange,
  onTargetUrlChange,
  onPriorityChange,
  onIsActiveChange,
  onLogicOpChange,
  onConditionsChange,
  showLogicHint = true,
}: RoutingRuleFormFieldsProps) {
  const addCondition = () => {
    onConditionsChange([
      ...conditions,
      { type: 'country', operator: 'equals', value: '' },
    ]);
  };

  const removeCondition = (index: number) => {
    onConditionsChange(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (
    index: number,
    field: keyof ConditionItemDto,
    value: string
  ) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    onConditionsChange(updated);
  };

  const renderConditionValue = (condition: ConditionItemDto, index: number) => {
    if (condition.type === 'device') {
      return (
        <Select
          value={typeof condition.value === 'string' ? condition.value : ''}
          onValueChange={(value) => updateCondition(index, 'value', value)}
        >
          <SelectTrigger className="w-37.5">
            <SelectValue placeholder={t('routing.selectValue')} />
          </SelectTrigger>
          <SelectContent>
            {DEVICE_OPTIONS.map((device) => (
              <SelectItem key={device.value} value={device.value}>
                {t(device.label as TranslationKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (condition.type === 'os') {
      return (
        <Select
          value={typeof condition.value === 'string' ? condition.value : ''}
          onValueChange={(value) => updateCondition(index, 'value', value)}
        >
          <SelectTrigger className="w-37.5">
            <SelectValue placeholder={t('routing.selectValue')} />
          </SelectTrigger>
          <SelectContent>
            {OS_OPTIONS.map((os) => (
              <SelectItem key={os.value} value={os.value}>
                {t(os.label as TranslationKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (condition.type === 'browser') {
      return (
        <Select
          value={typeof condition.value === 'string' ? condition.value : ''}
          onValueChange={(value) => updateCondition(index, 'value', value)}
        >
          <SelectTrigger className="w-37.5">
            <SelectValue placeholder={t('routing.selectValue')} />
          </SelectTrigger>
          <SelectContent>
            {BROWSER_OPTIONS.map((browser) => (
              <SelectItem key={browser.value} value={browser.value}>
                {t(browser.label as TranslationKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (condition.type === 'day_of_week') {
      return (
        <Select
          value={typeof condition.value === 'string' ? condition.value : ''}
          onValueChange={(value) => updateCondition(index, 'value', value)}
        >
          <SelectTrigger className="w-37.5">
            <SelectValue placeholder={t('routing.selectValue')} />
          </SelectTrigger>
          <SelectContent>
            {DAY_OPTIONS.map((day) => (
              <SelectItem key={day.value} value={day.value}>
                {t(day.label as TranslationKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        className="flex-1"
        placeholder={t('routing.valuePlaceholder')}
        value={typeof condition.value === 'string' ? condition.value : ''}
        onChange={(e) => updateCondition(index, 'value', e.target.value)}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Name & Priority */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}name`}>{t('routing.nameRequired')}</Label>
          <Input
            id={`${idPrefix}name`}
            placeholder={t('routing.namePlaceholder')}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}priority`}>{t('routing.priority')}</Label>
          <Input
            id={`${idPrefix}priority`}
            type="number"
            value={priority}
            onChange={(e) => onPriorityChange(Number(e.target.value))}
            min={0}
          />
        </div>
      </div>

      {/* Target URL */}
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}targetUrl`}>{t('routing.targetUrlRequired')}</Label>
        <Input
          id={`${idPrefix}targetUrl`}
          type="url"
          placeholder={t('routing.targetUrlPlaceholder')}
          value={targetUrl}
          onChange={(e) => onTargetUrlChange(e.target.value)}
          required
        />
      </div>

      {/* Logic Selector */}
      <div className="grid gap-2">
        <Label>{t('routing.logic')}</Label>
        <Select value={logicOp} onValueChange={(v) => onLogicOpChange(v as LogicalOperator)}>
          <SelectTrigger className="w-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">{t('routing.logicAnd')}</SelectItem>
            <SelectItem value="OR">{t('routing.logicOr')}</SelectItem>
          </SelectContent>
        </Select>
        {showLogicHint && (
          <p className="text-sm text-muted-foreground">
            {logicOp === 'AND' ? t('routing.logicAndHint') : t('routing.logicOrHint')}
          </p>
        )}
      </div>

      {/* Conditions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t('routing.conditions')}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCondition}>
            <Plus className="mr-1 h-4 w-4" />
            {t('routing.addCondition')}
          </Button>
        </div>

        {conditions.map((condition, index) => (
          <div key={index} className="flex items-center gap-2 rounded-md border p-2">
            <Select
              value={condition.type}
              onValueChange={(v) => updateCondition(index, 'type', v)}
            >
              <SelectTrigger className="w-32.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t(type.label as TranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={condition.operator}
              onValueChange={(v) => updateCondition(index, 'operator', v)}
            >
              <SelectTrigger className="w-30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {t(op.label as TranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {renderConditionValue(condition, index)}

            {conditions.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCondition(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Is Active */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={`${idPrefix}isActive`}>{t('routing.isActive')}</Label>
          <p className="text-sm text-muted-foreground">
            {t('routing.isActiveHint')}
          </p>
        </div>
        <Switch
          id={`${idPrefix}isActive`}
          checked={isActive}
          onCheckedChange={onIsActiveChange}
        />
      </div>
    </div>
  );
}
