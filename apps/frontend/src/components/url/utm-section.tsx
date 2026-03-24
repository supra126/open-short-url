'use client';

import { t } from '@/lib/i18n';
import { UtmComboboxInput } from './utm-combobox-input';
import { UtmTemplateSelect } from './utm-template-select';
import { EMPTY_UTM_VALUES, type UtmValues } from '@/lib/utm-templates';

export type { UtmValues };

export interface UtmSectionProps {
  values: UtmValues;
  onChange: (values: UtmValues) => void;
}

export function UtmSection({ values, onChange }: UtmSectionProps) {
  const handleFieldChange = (field: keyof UtmValues) => (value: string) => {
    onChange({ ...values, [field]: value });
  };

  const handleTemplateApply = (partial: Partial<UtmValues>) => {
    onChange({ ...EMPTY_UTM_VALUES, ...partial });
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium mb-1">{t('urls.utmSection')}</h4>
          <p className="text-xs text-muted-foreground">
            {t('urls.utmSectionDesc')}
          </p>
        </div>
        <UtmTemplateSelect onApply={handleTemplateApply} />
      </div>

      <UtmComboboxInput
        field="utmSource"
        label={t('urls.utmSource')}
        placeholder={t('urls.utmSourcePlaceholder')}
        hint={t('urls.utmSourceHint')}
        value={values.utmSource}
        onChange={handleFieldChange('utmSource')}
      />

      <UtmComboboxInput
        field="utmMedium"
        label={t('urls.utmMedium')}
        placeholder={t('urls.utmMediumPlaceholder')}
        hint={t('urls.utmMediumHint')}
        value={values.utmMedium}
        onChange={handleFieldChange('utmMedium')}
      />

      <UtmComboboxInput
        field="utmCampaign"
        label={t('urls.utmCampaign')}
        placeholder={t('urls.utmCampaignPlaceholder')}
        hint={t('urls.utmCampaignHint')}
        value={values.utmCampaign}
        onChange={handleFieldChange('utmCampaign')}
      />

      <UtmComboboxInput
        field="utmId"
        label={t('urls.utmId')}
        placeholder={t('urls.utmIdPlaceholder')}
        hint={t('urls.utmIdHint')}
        value={values.utmId}
        onChange={handleFieldChange('utmId')}
      />

      <UtmComboboxInput
        field="utmSourcePlatform"
        label={t('urls.utmSourcePlatform')}
        placeholder={t('urls.utmSourcePlatformPlaceholder')}
        hint={t('urls.utmSourcePlatformHint')}
        value={values.utmSourcePlatform}
        onChange={handleFieldChange('utmSourcePlatform')}
      />

      <UtmComboboxInput
        field="utmTerm"
        label={t('urls.utmTerm')}
        placeholder={t('urls.utmTermPlaceholder')}
        hint={t('urls.utmTermHint')}
        value={values.utmTerm}
        onChange={handleFieldChange('utmTerm')}
      />

      <UtmComboboxInput
        field="utmContent"
        label={t('urls.utmContent')}
        placeholder={t('urls.utmContentPlaceholder')}
        hint={t('urls.utmContentHint')}
        value={values.utmContent}
        onChange={handleFieldChange('utmContent')}
      />
    </div>
  );
}
