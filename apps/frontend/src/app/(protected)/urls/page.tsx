import { t } from '@/lib/i18n';
import { UrlList } from '@/components/url/url-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UrlsPage() {
  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('urls.management')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('urls.managementDesc')}
          </p>
        </div>
        <Link href="/urls/new">
          <Button>➕ {t('urls.createNew')}</Button>
        </Link>
      </div>

      {/* URL List */}
      <UrlList />
    </div>
  );
}
