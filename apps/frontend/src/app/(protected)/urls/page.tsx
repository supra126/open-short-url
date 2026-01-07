import { t } from '@/lib/i18n';
import { UrlList } from '@/components/url/url-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function UrlsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('urls.management')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('urls.managementDesc')}
          </p>
        </div>
        <Button size="lg" asChild className="whitespace-nowrap">
          <Link href="/urls/new" className="inline-flex items-center">
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            {t('urls.createNew')}
          </Link>
        </Button>
      </div>

      {/* URL List */}
      <UrlList />
    </div>
  );
}
