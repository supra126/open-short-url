import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { t } from '@/lib/i18n';
import { Link as LinkIcon, BarChart3, Shield, Zap } from 'lucide-react';

function LoginContent() {
  return (
    <div className="w-full max-w-md px-6">
      <LoginForm />
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/70">{description}</p>
      </div>
    </div>
  );
}

const NOISE_TEXTURE_SVG = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E\")";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - Brand visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/15 blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </div>
        {/* Geometric grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: NOISE_TEXTURE_SVG }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {process.env.NEXT_PUBLIC_BRAND_ICON_URL ? (
              <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center bg-white/10 backdrop-blur-sm">
                <img
                  src={process.env.NEXT_PUBLIC_BRAND_ICON_URL}
                  alt={t('sidebar.brandIconAlt')}
                  className="h-full w-full object-contain invert"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="text-xl font-display font-bold text-white">
              {process.env.NEXT_PUBLIC_BRAND_NAME || t('sidebar.appName')}
            </span>
          </div>

          {/* Main headline */}
          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl font-display font-bold text-white leading-tight">
              {t('auth.loginHeroTitle')}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              {t('auth.loginHeroDescription')}
            </p>

            {/* Feature highlights */}
            <div className="space-y-4 pt-4">
              <FeatureItem
                icon={<Zap className="h-5 w-5 text-white" />}
                title={t('auth.feature1Title')}
                description={t('auth.feature1Desc')}
              />
              <FeatureItem
                icon={<BarChart3 className="h-5 w-5 text-white" />}
                title={t('auth.feature2Title')}
                description={t('auth.feature2Desc')}
              />
              <FeatureItem
                icon={<Shield className="h-5 w-5 text-white" />}
                title={t('auth.feature3Title')}
                description={t('auth.feature3Desc')}
              />
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-white/50">
            {process.env.NEXT_PUBLIC_BRAND_DESCRIPTION || t('sidebar.appDescription')}
          </p>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center bg-background">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <LinkIcon className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">
            {process.env.NEXT_PUBLIC_BRAND_NAME || t('sidebar.appName')}
          </span>
        </div>

        <Suspense fallback={
          <div className="w-full max-w-md px-6">
            <div className="animate-pulse">{t('common.loading')}</div>
          </div>
        }>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
