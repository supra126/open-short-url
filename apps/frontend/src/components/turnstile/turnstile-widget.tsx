'use client';

import {
  Turnstile,
  TurnstileInstance,
} from '@marsidev/react-turnstile';
import { useRef, forwardRef, useImperativeHandle } from 'react';

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
  /**
   * Widget size
   * - "normal": Standard size (300x65px)
   * - "compact": Compact size (150x140px)
   * - "flexible": Flexible width (automatically adapts to container width)
   * @default "flexible"
   */
  size?: 'normal' | 'compact' | 'flexible';
  /**
   * Widget theme
   * @default "light"
   */
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Check if Turnstile is enabled
 * @returns true if NEXT_PUBLIC_TURNSTILE_SITE_KEY is set
 */
export function isTurnstileEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

/**
 * Cloudflare Turnstile Widget
 * Human verification component
 */
export const TurnstileWidget = forwardRef<
  TurnstileWidgetRef,
  TurnstileWidgetProps
>(function TurnstileWidget(
  {
    onSuccess,
    onError,
    onExpire,
    className = 'w-full',
    size = 'flexible',
    theme = 'light',
  },
  ref
) {
  const turnstileRef = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Expose reset method to parent component
  useImperativeHandle(ref, () => ({
    reset: () => {
      turnstileRef.current?.reset();
    },
  }));

  // Silently return null if Turnstile is not configured
  // This allows the application to work without Turnstile in development or when not needed
  if (!siteKey) {
    return null;
  }

  return (
    <div className={className}>
      {/* Fixed height container to prevent CLS */}
      <div className="min-h-16.25 flex items-center justify-center">
        <Turnstile
          ref={turnstileRef}
          siteKey={siteKey}
          onSuccess={onSuccess}
          onError={onError}
          onExpire={onExpire}
          options={{
            theme,
            size,
          }}
        />
      </div>
    </div>
  );
});
