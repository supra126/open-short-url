'use client';

import dynamic from 'next/dynamic';
import { Loading } from '@/components/ui/loading';
import { t } from '@/lib/i18n';

// Dynamically import AnalyticsDashboard for code splitting and lazy loading
const AnalyticsDashboard = dynamic(
  () =>
    import('@/components/analytics/analytics-dashboard').then(
      (mod) => mod.AnalyticsDashboard
    ),
  {
    loading: () => <Loading text={t('analytics.loadingData')} />,
    ssr: false,
  }
);

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('analytics.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('analytics.description')}
        </p>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard />
    </div>
  );
}
