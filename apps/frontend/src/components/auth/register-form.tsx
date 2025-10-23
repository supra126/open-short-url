/**
 * Register Form Component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegister } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';

export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    try {
      await register.mutateAsync({
        email: formData.email,
        password: formData.password,
        name: formData.name || undefined,
      });
      router.push('/');
    } catch (err: any) {
      setError(err.message || t('auth.registerError'));
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t('auth.registerTitle')}</CardTitle>
        <CardDescription>
          {t('auth.registerDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Input
            label={t('common.nameOptional')}
            type="text"
            placeholder={t('auth.namePlaceholder')}
            value={formData.name}
            onChange={handleChange('name')}
            autoComplete="name"
          />

          <Input
            label={t('common.email')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={formData.email}
            onChange={handleChange('email')}
            required
            autoComplete="email"
          />

          <Input
            label={t('common.password')}
            type="password"
            placeholder={t('auth.passwordMinLength')}
            value={formData.password}
            onChange={handleChange('password')}
            required
            autoComplete="new-password"
          />

          <Input
            label={t('common.confirmPassword')}
            type="password"
            placeholder={t('auth.confirmPasswordPlaceholder')}
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={register.isPending}
          >
            {t('auth.registerButton')}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {t('auth.hasAccount')}{' '}
          <a href="/login" className="text-primary hover:underline">
            {t('auth.loginNow')}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
