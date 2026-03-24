'use client';

import { t, tDynamic } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { UTM_TEMPLATES } from '@/lib/utm-templates';
import type { UtmValues } from '@/lib/utm-templates';

interface UtmTemplateSelectProps {
  onApply: (values: Partial<UtmValues>) => void;
}

export function UtmTemplateSelect({ onApply }: UtmTemplateSelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          {t('urls.templates.applyTemplate')}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {UTM_TEMPLATES.map((tpl) => (
          <DropdownMenuItem key={tpl.id} onSelect={() => onApply(tpl.values)}>
            {tDynamic(tpl.labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
