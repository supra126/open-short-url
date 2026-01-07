'use client';

import { useState } from 'react';
import {
  useAuditLogs,
  type AuditAction,
  type AuditLogDto,
  type AuditLogQueryParams,
} from '@/hooks/use-audit-logs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { t, TranslationKey } from '@/lib/i18n';

// Available actions based on backend enum
const AUDIT_ACTIONS = [
  'URL_CREATED',
  'URL_UPDATED',
  'URL_DELETED',
  'URL_BULK_CREATED',
  'URL_BULK_UPDATED',
  'URL_BULK_DELETED',
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'API_KEY_CREATED',
  'API_KEY_DELETED',
  'SETTINGS_UPDATED',
  'PASSWORD_CHANGED',
  'TWO_FACTOR_ENABLED',
  'TWO_FACTOR_DISABLED',
  'VARIANT_CREATED',
  'VARIANT_UPDATED',
  'VARIANT_DELETED',
  'BUNDLE_CREATED',
  'BUNDLE_UPDATED',
  'BUNDLE_DELETED',
  'WEBHOOK_CREATED',
  'WEBHOOK_UPDATED',
  'WEBHOOK_DELETED',
] as const;

// Available entity types
const ENTITY_TYPES = [
  'url',
  'user',
  'api_key',
  'bundle',
  'variant',
  'webhook',
  'settings',
] as const;

function getActionBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (action.includes('DELETED')) return 'destructive';
  if (action.includes('CREATED')) return 'default';
  if (action.includes('UPDATED') || action.includes('CHANGED')) return 'secondary';
  if (action.includes('LOGIN') || action.includes('ENABLED')) return 'outline';
  return 'secondary';
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<AuditAction | undefined>();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | undefined>();
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  const queryParams: AuditLogQueryParams = {
    page,
    pageSize: 20,
    action: actionFilter,
    entityType: entityTypeFilter,
    sortOrder: 'desc',
  };

  const { data, isLoading } = useAuditLogs(queryParams);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatJson = (value: Record<string, unknown> | null | undefined) => {
    if (!value) return '-';
    return JSON.stringify(value, null, 2);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('auditLogs.title')}</h1>
        <p className="text-muted-foreground">{t('auditLogs.description')}</p>
      </div>

      <div className="space-y-6">
        {/* Filters */}
        <div className="flex gap-4">
          <Select
            value={actionFilter || 'all'}
            onValueChange={(value) => {
              setActionFilter(value === 'all' ? undefined : (value as AuditAction));
              setPage(1); // Reset page when filter changes
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('auditLogs.filters.action')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('auditLogs.filters.allActions')}</SelectItem>
              {AUDIT_ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {t(`auditLogs.actions.${action}` as TranslationKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={entityTypeFilter || 'all'}
            onValueChange={(value) => {
              setEntityTypeFilter(value === 'all' ? undefined : value);
              setPage(1); // Reset page when filter changes
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('auditLogs.filters.entityType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('auditLogs.filters.allEntityTypes')}</SelectItem>
              {ENTITY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`auditLogs.entityTypes.${type}` as TranslationKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">{t('auditLogs.table.time')}</TableHead>
                <TableHead>{t('auditLogs.table.user')}</TableHead>
                <TableHead>{t('auditLogs.table.action')}</TableHead>
                <TableHead>{t('auditLogs.table.entity')}</TableHead>
                <TableHead>{t('auditLogs.table.ipAddress')}</TableHead>
                <TableHead className="w-[80px]">{t('auditLogs.table.details')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              ) : !data?.data || data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <p className="font-medium">{t('auditLogs.noLogs')}</p>
                      <p className="text-sm">{t('auditLogs.noLogsDesc')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((log: AuditLogDto) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div>
                          <p className="font-medium">{log.user.name || log.user.email.split('@')[0]}</p>
                          <p className="text-xs text-muted-foreground">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{t('common.noValue')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {t(`auditLogs.actions.${log.action}` as TranslationKey)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {t(`auditLogs.entityTypes.${log.entityType}` as TranslationKey)}
                        </Badge>
                        {log.entityId && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {log.entityId.length > 12
                              ? `${log.entityId.substring(0, 12)}...`
                              : log.entityId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ipAddress || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('common.showing')} {(page - 1) * 20 + 1} {t('common.to')}{' '}
              {Math.min(page * 20, data.total)} {t('common.of')} {data.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('common.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === data.totalPages}
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('auditLogs.table.details')}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('auditLogs.table.time')}
                  </label>
                  <p className="font-mono">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('auditLogs.table.action')}
                  </label>
                  <div className="mt-1">
                    <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                      {t(`auditLogs.actions.${selectedLog.action}` as TranslationKey)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('auditLogs.table.user')}
                  </label>
                  <p>{selectedLog.user?.email || t('common.noValue')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('auditLogs.table.entity')}
                  </label>
                  <p>
                    {t(`auditLogs.entityTypes.${selectedLog.entityType}` as TranslationKey)}
                    {selectedLog.entityId && ` (${selectedLog.entityId})`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('auditLogs.table.ipAddress')}
                  </label>
                  <p className="font-mono">{selectedLog.ipAddress || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('auditLogs.detailsDialog.userAgent')}
                  </label>
                  <p className="text-xs text-muted-foreground break-all">
                    {selectedLog.userAgent || '-'}
                  </p>
                </div>
              </div>

              {selectedLog.oldValue && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('auditLogs.detailsDialog.oldValue')}
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {formatJson(selectedLog.oldValue)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('auditLogs.detailsDialog.newValue')}
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {formatJson(selectedLog.newValue)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('auditLogs.detailsDialog.metadata')}
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {formatJson(selectedLog.metadata)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
