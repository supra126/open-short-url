/**
 * Login Form Component
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { TurnstileWidget, isTurnstileEnabled } from '@/components/turnstile/turnstile-widget';
import { t } from '@/lib/i18n';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  // Check if Turnstile is enabled
  const turnstileEnabled = isTurnstileEnabled();

  // Get redirect URL from query params (set by middleware)
  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check Turnstile token only if Turnstile is enabled
    if (turnstileEnabled && !turnstileToken) {
      setError(t('auth.turnstileRequired'));
      return;
    }

    try {
      const data = await login.mutateAsync({
        email,
        password,
        // Only include turnstileToken if Turnstile is enabled
        ...(turnstileEnabled && { turnstileToken }),
        ...(showTwoFactor && { twoFactorCode }),
      });

      // Check if 2FA is required
      if (data.requires2FA) {
        setShowTwoFactor(true);
        return;
      }

      // Login successful - redirect to original URL or dashboard
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || t('auth.loginError'));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t('auth.loginTitle')}</CardTitle>
        <CardDescription>{t('auth.loginDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!showTwoFactor ? (
            <>
              <Input
                label={t('common.email')}
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label={t('common.password')}
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              {/* Only render Turnstile if it's enabled */}
              {turnstileEnabled && (
                <TurnstileWidget
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                  }}
                  onError={() => {
                    setTurnstileToken('');
                    setError(t('auth.turnstileError'));
                  }}
                  onExpire={() => {
                    setTurnstileToken('');
                    setError(t('auth.turnstileExpired'));
                  }}
                />
              )}
            </>
          ) : (
            <>
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium mb-1">
                  {t('auth.twoFactorRequired')}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t('auth.twoFactorDescription')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t('auth.verificationCode')}
                </label>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={twoFactorCode}
                  onChange={(value) => setTwoFactorCode(value)}
                  autoFocus
                  containerClassName="gap-3"
                >
                  <InputOTPGroup className="w-full justify-center">
                    <InputOTPSlot index={0} className="h-14 w-14 text-3xl" />
                    <InputOTPSlot index={1} className="h-14 w-14 text-3xl" />
                    <InputOTPSlot index={2} className="h-14 w-14 text-3xl" />
                    <InputOTPSlot index={3} className="h-14 w-14 text-3xl" />
                    <InputOTPSlot index={4} className="h-14 w-14 text-3xl" />
                    <InputOTPSlot index={5} className="h-14 w-14 text-3xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowTwoFactor(false);
                  setTwoFactorCode('');
                  setError('');
                }}
              >
                {t('common.back')}
              </Button>
            </>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={login.isPending}
            disabled={
              login.isPending ||
              // Only require turnstileToken if Turnstile is enabled
              (!showTwoFactor && turnstileEnabled && !turnstileToken) ||
              (showTwoFactor && twoFactorCode.length !== 6)
            }
          >
            {showTwoFactor ? t('auth.verifyButton') : t('auth.loginButton')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
