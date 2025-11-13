'use client';

import { t } from '@/lib/i18n';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Calendar,
  MousePointerClick,
  Edit,
  Trash2,
  Loader2,
  QrCode,
  Download,
  Bot,
} from 'lucide-react';
import { VariantList } from '@/components/variants/variant-list';
import Link from 'next/link';
import { useUrl, useDeleteUrl, useGenerateQRCode } from '@/hooks/use-url';
import { useUrlAnalytics, useRecentClicks, useBotAnalytics } from '@/hooks/use-analytics';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime, formatDate } from '@/lib/utils';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function UrlDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  // Fetch URL details
  const { data: urlData, isPending, error } = useUrl(id);
  const deleteUrlMutation = useDeleteUrl();
  const generateQRCodeMutation = useGenerateQRCode();

  // Fetch analytics data (last 7 days)
  const { data: analyticsData } = useUrlAnalytics(id, {
    timeRange: 'last_7_days',
  });

  // Bot toggle state
  const [showBots, setShowBots] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch recent click records (with bot filter)
  const { data: recentClicksData } = useRecentClicks(id, 10, showBots);

  // Fetch bot analytics
  const { data: botAnalyticsData } = useBotAnalytics(id, {
    timeRange: 'last_7_days',
  });

  // QR Code state
  const [qrCode, setQrCode] = useState<string | null>(null);

  const handleCopyShortUrl = async () => {
    if (!urlData) return;

    const shortUrl = urlData.shortUrl;
    await navigator.clipboard.writeText(shortUrl);

    toast({
      title: t('common.copied'),
      description: 'Short URL copied',
    });
  };

  const handleGenerateQRCode = async () => {
    if (!urlData) return;

    try {
      const response = await generateQRCodeMutation.mutateAsync(id);
      setQrCode(response.qrCode);
      toast({
        title: t('urls.qrCodeGenerateSuccess'),
        description: t('urls.qrCodeGenerateSuccessDesc'),
      });
    } catch (error) {
      toast({
        title: t('urls.qrCodeGenerateError'),
        description: t('urls.qrCodeGenerateErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qrcode-${urlData?.slug || t('urls.defaultFilename')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t('urls.qrCodeDownloadSuccess'),
      description: t('urls.qrCodeDownloadSuccessDesc'),
    });
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUrlMutation.mutateAsync(id);
      toast({
        title: t('urls.deleteSuccess'),
        description: t('urls.deleteSuccess'),
      });
      router.push('/urls');
    } catch (error) {
      toast({
        title: t('urls.deleteError'),
        description: t('urls.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Only show loading on first load when there's no data
  if (isPending) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !urlData) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{t('urls.notFound')}</p>
        <Button onClick={() => router.push('/urls')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('urls.backToList')}
        </Button>
      </div>
    );
  }

  const shortUrl = urlData.shortUrl;

  return (
    <>
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/urls">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t('urls.detail')}</h1>
            <p className="text-muted-foreground mt-1">{t('urls.detailDesc')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/urls/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDeleteClick}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* URL Information */}
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('urls.shortUrlCard')}</CardTitle>
            <CardDescription>{t('urls.shortUrlCardDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-sm">
                {shortUrl}
              </code>
              <Button size="sm" variant="outline" onClick={handleCopyShortUrl}>
                <Copy className="h-4 w-4" />
              </Button>
              <Link href={shortUrl} target="_blank">
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('urls.originalUrlCard')}</CardTitle>
            <CardDescription>{t('urls.originalUrlCardDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm">
                {urlData.originalUrl}
              </code>
              <Link href={urlData.originalUrl} target="_blank">
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('urls.totalClicksCard')}</CardDescription>
            <CardTitle className="text-3xl">{urlData.clickCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <MousePointerClick className="mr-1 h-3 w-3" />
              {t('urls.cumulativeVisits')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('urls.createdAtCard')}</CardDescription>
            <CardTitle className="text-lg">
              {formatDate(urlData.createdAt)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              {formatDateTime(urlData.createdAt)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('urls.slugCard')}</CardDescription>
            <CardTitle className="text-lg">{urlData.slug}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {t('urls.slugIdentifier')}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* UTM Parameters */}
        {(urlData.utmSource ||
        urlData.utmMedium ||
        urlData.utmCampaign ||
        urlData.utmTerm ||
        urlData.utmContent) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('urls.utmSection')}</CardTitle>
            <CardDescription>{t('urls.utmSectionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {urlData.utmSource && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('urls.utmSource')}
                  </div>
                  <div className="rounded-md bg-muted px-3 py-2 text-sm font-mono">
                    {urlData.utmSource}
                  </div>
                </div>
              )}
              {urlData.utmMedium && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('urls.utmMedium')}
                  </div>
                  <div className="rounded-md bg-muted px-3 py-2 text-sm font-mono">
                    {urlData.utmMedium}
                  </div>
                </div>
              )}
              {urlData.utmCampaign && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('urls.utmCampaign')}
                  </div>
                  <div className="rounded-md bg-muted px-3 py-2 text-sm font-mono">
                    {urlData.utmCampaign}
                  </div>
                </div>
              )}
              {urlData.utmTerm && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('urls.utmTerm')}
                  </div>
                  <div className="rounded-md bg-muted px-3 py-2 text-sm font-mono">
                    {urlData.utmTerm}
                  </div>
                </div>
              )}
              {urlData.utmContent && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('urls.utmContent')}
                  </div>
                  <div className="rounded-md bg-muted px-3 py-2 text-sm font-mono">
                    {urlData.utmContent}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* QR Code */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t('urls.qrCode')}
          </CardTitle>
          <CardDescription>{t('urls.qrCodeDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {!qrCode ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-[256px] w-[256px] items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25">
                  <div className="text-center">
                    <QrCode className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t('urls.qrCodeNotGenerated')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateQRCode}
                  disabled={generateQRCodeMutation.isPending}
                >
                  {generateQRCodeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('urls.qrCodeGenerating')}
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      {t('urls.qrCodeGenerate')}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-md border-2 border-muted p-4">
                  <img
                    src={qrCode}
                    alt="QR Code"
                    className="h-[256px] w-[256px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadQRCode} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {t('urls.qrCodeDownload')}
                  </Button>
                  <Button
                    onClick={handleGenerateQRCode}
                    variant="outline"
                    disabled={generateQRCodeMutation.isPending}
                  >
                    {generateQRCodeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('urls.qrCodeRegenerating')}
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        {t('urls.qrCodeRegenerate')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        </Card>

        {/* Analytics Chart */}
        <Card>
        <CardHeader>
          <CardTitle>{t('urls.clickTrend')}</CardTitle>
          <CardDescription>{t('urls.clickTrendDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData && analyticsData.timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => {
                    return formatDate(value as string);
                  }}
                  formatter={(value: number) => [value, t('urls.clicksLabel')]}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                {t('urls.noData')}
              </p>
            </div>
          )}
        </CardContent>
        </Card>

        {/* Bot Analytics */}
        {botAnalyticsData && botAnalyticsData.totalBotClicks > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {t('bots.analyticsTitle')}
              </CardTitle>
              <CardDescription>
                {t('bots.last7DaysStats').replace('{total}', String(botAnalyticsData.totalBotClicks))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {botAnalyticsData.botTypes.map((bot) => (
                  <div
                    key={bot.botName}
                    className="flex items-center justify-between rounded-md border px-4 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{bot.botName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{bot.clicks} 次</div>
                      <div className="text-xs text-muted-foreground">
                        {bot.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Clicks */}
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('urls.recentClicks')}</CardTitle>
              <CardDescription>{t('urls.recentClicksDesc')}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-bots"
                checked={showBots}
                onCheckedChange={setShowBots}
              />
              <Label htmlFor="show-bots" className="cursor-pointer text-sm">
                {t('bots.showBots')}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentClicksData && recentClicksData.clicks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">
                      {t('urls.timeHeader')}
                    </th>
                    <th className="pb-2 text-left font-medium">
                      {t('urls.locationHeader')}
                    </th>
                    <th className="pb-2 text-left font-medium">
                      {t('urls.deviceHeader')}
                    </th>
                    <th className="pb-2 text-left font-medium">
                      {t('urls.browserHeader')}
                    </th>
                    <th className="pb-2 text-left font-medium">
                      {t('urls.sourceHeader')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentClicksData.clicks.map((click) => (
                    <tr
                      key={click.id}
                      className={`border-b last:border-0 ${
                        click.isBot ? 'bg-muted/30' : ''
                      }`}
                    >
                      <td className="py-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {click.isBot && (
                            <span title={click.botName}>
                              <Bot className="h-3 w-3 text-orange-500" />
                            </span>
                          )}
                          {formatDateTime(click.createdAt)}
                        </div>
                      </td>
                      <td className="py-3">
                        {click.isBot ? (
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            {click.botName || 'Bot'}
                          </span>
                        ) : (
                          <>
                            {click.country || t('urls.unknown')}
                            {click.city && ` · ${click.city}`}
                          </>
                        )}
                      </td>
                      <td className="py-3">
                        {click.device || t('urls.unknown')}
                        {click.os && ` · ${click.os}`}
                      </td>
                      <td className="py-3">
                        {click.browser || t('urls.unknown')}
                      </td>
                      <td className="py-3 max-w-[200px] truncate">
                        {click.referer ? (
                          <a
                            href={click.referer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {new URL(click.referer).hostname}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            {t('urls.directVisit')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentClicksData.total > 10 && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {t('urls.showingRecentRecords').replace(
                    '{total}',
                    String(recentClicksData.total)
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                {t('urls.noVisits')}
              </p>
            </div>
          )}
        </CardContent>
        </Card>

        {/* A/B Testing Variants */}
        <VariantList urlId={id} />
      </div>
    </div>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('urls.deleteConfirm')}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the short URL and all its analytics data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
