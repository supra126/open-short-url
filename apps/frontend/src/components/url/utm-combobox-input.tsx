'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { useUtmSuggestions } from '@/hooks/use-utm-suggestions';
import type { UtmFieldName } from '@/lib/api/schemas';

interface UtmComboboxInputProps {
  field: UtmFieldName;
  label: string;
  placeholder: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

export function UtmComboboxInput({
  field,
  label,
  placeholder,
  hint,
  value,
  onChange,
}: UtmComboboxInputProps) {
  const [open, setOpen] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { data: suggestions = [] } = useUtmSuggestions(field);

  const filtered = suggestions.filter(
    (s) =>
      s.value.toLowerCase().startsWith(value.toLowerCase()) &&
      s.value.toLowerCase() !== value.toLowerCase()
  );

  const handleFocus = () => {
    clearTimeout(blurTimeoutRef.current);
    setOpen(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <Input
            label={label}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoComplete="off"
          />
        </PopoverAnchor>
        <PopoverContent
          className="p-1 w-[var(--radix-popover-anchor-width)]"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((s) => (
              <button
                key={s.value}
                type="button"
                className="w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s.value)}
              >
                <span>{s.value}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  &times;{s.count}
                </span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
