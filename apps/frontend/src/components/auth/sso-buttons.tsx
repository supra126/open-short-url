'use client';

import { useOidcProviders } from '@/hooks/use-oidc';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

interface SsoButtonsProps {
  redirectAfter?: string;
}

export function SsoButtons({ redirectAfter = '/' }: SsoButtonsProps) {
  const { data: providers, isLoading } = useOidcProviders();

  if (isLoading || !providers || providers.length === 0) {
    return null;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4101';

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            {t('auth.ssoOr')}
          </span>
        </div>
      </div>

      <div className="grid gap-2">
        {providers.map((provider) => (
          <Button
            key={provider.slug}
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              const params = new URLSearchParams();
              if (redirectAfter && redirectAfter !== '/') {
                params.set('redirect', redirectAfter);
              }
              const query = params.toString();
              window.location.href = `${apiUrl}/api/auth/sso/${provider.slug}/login${query ? `?${query}` : ''}`;
            }}
          >
            {t('auth.ssoLoginWith', { provider: provider.name })}
          </Button>
        ))}
      </div>
    </div>
  );
}
