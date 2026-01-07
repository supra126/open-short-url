import { t } from '@/lib/i18n';
import { CreateUrlForm } from '@/components/url/create-url-form';

export default function NewUrlPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('urls.createTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('urls.createDesc')}</p>
      </div>

      <CreateUrlForm />
    </div>
  );
}
