'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/i18n';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  useWebhooks,
  useDeleteWebhook,
  useTestWebhook,
  useWebhookLogs,
  type WebhookResponseDto,
  type WebhookLogResponseDto,
} from '@/hooks/use-webhooks';
import { WebhookDialog } from '@/components/webhooks/webhook-dialog';
import {
  Webhook,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TestTube2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function WebhooksPage() {
  const { data, isLoading, error } = useWebhooks();
  const deleteMutation = useDeleteWebhook();
  const testMutation = useTestWebhook();
  const { toast } = useToast();

  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);
  const [logsWebhookId, setLogsWebhookId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteWebhookId) return;

    try {
      await deleteMutation.mutateAsync(deleteWebhookId);

      toast({
        title: t('webhooks.deleted'),
        description: t('webhooks.deletedDesc'),
      });

      setDeleteWebhookId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('webhooks.deleteErrorDesc');
      toast({
        title: t('webhooks.deleteError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleTest = async (webhookId: string, webhookName: string) => {
    try {
      const result = await testMutation.mutateAsync(webhookId);

      if (result.success) {
        toast({
          title: t('webhooks.testSuccess'),
          description: t('webhooks.testSuccessDesc', { name: webhookName }),
        });
      } else {
        toast({
          title: t('webhooks.testFailed'),
          description: result.error || t('webhooks.testFailedDesc'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('webhooks.testErrorDesc');
      toast({
        title: t('webhooks.testError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-semibold">{t('webhooks.loadError')}</p>
        <p className="text-sm text-muted-foreground">{t('webhooks.loadErrorDesc')}</p>
      </div>
    );
  }

  const webhooks = data?.data || [];
  const hasWebhooks = webhooks.length > 0;

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('webhooks.title')}</h1>
          <p className="text-muted-foreground">
            {t('webhooks.description')}
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  {t('webhooks.listTitle')}
                </CardTitle>
                <CardDescription>
                  {hasWebhooks
                    ? t('webhooks.currentCount', { count: webhooks.length })
                    : t('webhooks.noWebhooks')}
                </CardDescription>
              </div>
              <WebhookDialog />
            </div>
          </CardHeader>
          <CardContent>
            {!hasWebhooks ? (
              <div className="text-center py-12">
                <Webhook className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('webhooks.noWebhooks')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('webhooks.noWebhooksDesc')}
                </p>
                <WebhookDialog
                  trigger={
                    <Button>
                      <Webhook className="mr-2 h-4 w-4" />
                      {t('webhooks.createFirst')}
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('webhooks.name')}</TableHead>
                      <TableHead>{t('webhooks.url')}</TableHead>
                      <TableHead className="text-center">{t('webhooks.subscribedEvents')}</TableHead>
                      <TableHead className="text-center">{t('webhooks.status')}</TableHead>
                      <TableHead className="text-center">{t('webhooks.successRate')}</TableHead>
                      <TableHead className="text-center">{t('webhooks.lastSent')}</TableHead>
                      <TableHead className="text-right">{t('webhooks.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook: WebhookResponseDto) => {
                      const successRate =
                        webhook.totalSent > 0
                          ? Math.round(
                              (webhook.totalSuccess / webhook.totalSent) * 100
                            )
                          : 0;

                      return (
                        <TableRow key={webhook.id}>
                          <TableCell className="font-medium">
                            {webhook.name}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            <a
                              href={webhook.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {webhook.url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {webhook.events.map((event: string) => (
                                <Badge key={event} variant="outline" className="text-xs">
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                              {webhook.isActive ? t('webhooks.statusActive') : t('webhooks.statusInactive')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {webhook.totalSent > 0 ? (
                              <div className="flex items-center justify-center gap-1">
                                {successRate >= 90 ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : successRate >= 50 ? (
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span>{successRate}%</span>
                                <span className="text-muted-foreground text-xs">
                                  ({webhook.totalSuccess}/{webhook.totalSent})
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {webhook.lastSentAt
                              ? formatDistanceToNow(new Date(webhook.lastSentAt), {
                                  addSuffix: true,
                                  locale: zhTW,
                                })
                              : t('webhooks.neverSent')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLogsWebhookId(webhook.id)}
                                title={t('webhooks.viewLogs')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTest(webhook.id, webhook.name)}
                                disabled={testMutation.isPending}
                                title={t('webhooks.test')}
                              >
                                <TestTube2 className="h-4 w-4" />
                              </Button>
                              <WebhookDialog
                                webhook={webhook}
                                trigger={
                                  <Button variant="ghost" size="sm" title={t('webhooks.edit')}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteWebhookId(webhook.id)}
                                title={t('webhooks.delete')}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteWebhookId}
        onOpenChange={(open) => !open && setDeleteWebhookId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('webhooks.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('webhooks.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logs Dialog */}
      {logsWebhookId && (
        <WebhookLogsDialog
          webhookId={logsWebhookId}
          onClose={() => setLogsWebhookId(null)}
        />
      )}
    </>
  );
}

// Webhook Logs Dialog Component
function WebhookLogsDialog({
  webhookId,
  onClose,
}: {
  webhookId: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useWebhookLogs(webhookId, { page, pageSize: 10 });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('webhooks.logsTitle')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data && data.data.length > 0 ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {data.data.map((log: WebhookLogResponseDto) => (
              <Card key={log.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.event}</Badge>
                      {log.isSuccess ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {log.statusCode && (
                        <Badge
                          variant={
                            log.statusCode >= 200 && log.statusCode < 300
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {log.statusCode}
                        </Badge>
                      )}
                      {log.duration && <span>{log.duration}ms</span>}
                      <span>{t('webhooks.logsAttempt', { attempt: log.attempt })}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {log.error && (
                    <div className="text-sm text-destructive">
                      <strong>{t('webhooks.logsError')}</strong> {log.error}
                    </div>
                  )}
                  {log.response && (
                    <div className="text-sm">
                      <strong>{t('webhooks.logsResponse')}</strong>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {log.response}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  {t('common.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('common.page')} {page} {t('common.of')} {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.totalPages}
                >
                  {t('common.next')}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t('webhooks.logsNoData')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
