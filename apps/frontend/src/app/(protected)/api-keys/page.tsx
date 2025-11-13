/**
 * API Keys Management Page
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from '@/hooks/use-api-keys';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Copy, Key, Plus, Trash2 } from 'lucide-react';
import type { CreateApiKeyResponse } from '@/types/api-keys';

const createApiKeySchema = z.object({
  name: z.string().min(1, t('apiKeys.nameRequired')),
  expiresAt: z.string().optional(),
});

type CreateApiKeyFormData = z.infer<typeof createApiKeySchema>;

export default function ApiKeysPage() {
  const { data: apiKeys, isLoading } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const deleteApiKey = useDeleteApiKey();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createdApiKey, setCreatedApiKey] =
    useState<CreateApiKeyResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [apiKeyToDelete, setApiKeyToDelete] = useState<{ id: string; name: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApiKeyFormData>({
    resolver: zodResolver(createApiKeySchema),
  });

  const onSubmit = async (data: CreateApiKeyFormData) => {
    try {
      // Convert datetime-local format to ISO 8601 format
      const submitData = {
        name: data.name,
        expiresAt: data.expiresAt
          ? new Date(data.expiresAt).toISOString()
          : undefined,
      };

      const result = await createApiKey.mutateAsync(submitData);
      setCreatedApiKey(result);
      reset();
      toast({
        title: t('apiKeys.createSuccess'),
        description: t('apiKeys.createSuccessDesc'),
      });
    } catch (error: any) {
      toast({
        title: t('apiKeys.createError'),
        description: error.message || t('apiKeys.createErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setApiKeyToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!apiKeyToDelete) return;

    try {
      await deleteApiKey.mutateAsync(apiKeyToDelete.id);
      toast({
        title: t('apiKeys.deleteSuccess'),
        description: t('apiKeys.deleteSuccess'),
      });
    } catch (error: any) {
      toast({
        title: t('apiKeys.deleteError'),
        description: error.message || t('apiKeys.createErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setApiKeyToDelete(null);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('apiKeys.copySuccess'),
        description: t('apiKeys.copySuccessDesc'),
      });
    } catch (error) {
      toast({
        title: t('apiKeys.copyError'),
        description: t('apiKeys.copyErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt?: Date) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return <Loading text={t('common.loading')} />;
  }

  return (
    <>
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('apiKeys.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('apiKeys.description')}
          </p>
        </div>

        <Dialog
          open={isCreateDialogOpen || !!createdApiKey}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setCreatedApiKey(null);
              reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('apiKeys.create')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            {createdApiKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>{t('apiKeys.createDialogTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('apiKeys.createDialogDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t('apiKeys.name')}</Label>
                    <p className="mt-1 text-sm">{createdApiKey.name}</p>
                  </div>
                  <div>
                    <Label>{t('apiKeys.createDialogKey')}</Label>
                    <div className="mt-1 flex gap-2">
                      <code className="flex-1 rounded bg-muted p-2 text-xs break-all">
                        {createdApiKey.key}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(createdApiKey.key!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {t('apiKeys.createDialogWarning')}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setCreatedApiKey(null);
                      setIsCreateDialogOpen(false);
                    }}
                  >
                    {t('apiKeys.createDialogConfirm')}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>{t('apiKeys.createNewTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('apiKeys.createNewDesc')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('apiKeys.nameRequired')}</Label>
                      <Input
                        id="name"
                        placeholder={t('apiKeys.namePlaceholder')}
                        {...register('name')}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiresAt">
                        {t('apiKeys.expiresAtOptional')}
                      </Label>
                      <Input
                        id="expiresAt"
                        type="datetime-local"
                        {...register('expiresAt')}
                      />
                      {errors.expiresAt && (
                        <p className="text-sm text-destructive">
                          {errors.expiresAt.message}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {t('apiKeys.expiresAtHint')}
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={createApiKey.isPending}>
                      {createApiKey.isPending
                        ? t('apiKeys.creating')
                        : t('common.create')}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('apiKeys.yourKeys')}</CardTitle>
          <CardDescription>{t('apiKeys.keysDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!apiKeys?.data.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('apiKeys.noKeys')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('apiKeys.noKeysDesc')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('apiKeys.name')}</TableHead>
                  <TableHead>{t('apiKeys.keyPrefix')}</TableHead>
                  <TableHead>{t('apiKeys.lastUsed')}</TableHead>
                  <TableHead>{t('apiKeys.expiresAt')}</TableHead>
                  <TableHead>{t('urls.createdAt')}</TableHead>
                  <TableHead className="text-right">
                    {t('urls.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.data.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <code className="text-xs">{apiKey.prefix}</code>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(apiKey.lastUsedAt)}
                    </TableCell>
                    <TableCell>
                      {apiKey.expiresAt ? (
                        <Badge
                          variant={
                            isExpired(apiKey.expiresAt)
                              ? 'destructive'
                              : 'default'
                          }
                        >
                          {isExpired(apiKey.expiresAt)
                            ? t('apiKeys.expired')
                            : formatDate(apiKey.expiresAt)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t('apiKeys.neverExpires')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(apiKey.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(apiKey.id, apiKey.name)}
                        disabled={deleteApiKey.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('apiKeys.deleteConfirm').replace('{name}', apiKeyToDelete?.name || '')}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The API key will be permanently deleted.
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
