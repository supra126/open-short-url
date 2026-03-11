/**
 * OIDC SSO Providers Management Page (Admin Only)
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useOidcAdminProviders,
  useCreateOidcProvider,
  useUpdateOidcProvider,
  useDeleteOidcProvider,
  useSsoEnforceSetting,
  useUpdateSsoEnforce,
  type OidcProviderResponseDto,
} from '@/hooks/use-oidc-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import { formatDateTime } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Plus, Pencil, Trash2, ShieldCheck, Settings } from 'lucide-react';

const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

const createProviderSchema = z.object({
  name: z.string().min(1, t('oidcProviders.nameRequired')).max(100),
  slug: z
    .string()
    .min(1, t('oidcProviders.slugRequired'))
    .max(50)
    .regex(slugRegex, t('oidcProviders.slugInvalid')),
  discoveryUrl: z.string().url(t('oidcProviders.discoveryUrlInvalid')),
  clientId: z.string().min(1, t('oidcProviders.clientIdRequired')),
  clientSecret: z.string().min(1, t('oidcProviders.clientSecretRequired')),
  scopes: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateProviderSchema = z.object({
  name: z.string().min(1, t('oidcProviders.nameRequired')).max(100).optional(),
  discoveryUrl: z.string().url(t('oidcProviders.discoveryUrlInvalid')).optional(),
  clientId: z.string().min(1, t('oidcProviders.clientIdRequired')).optional(),
  clientSecret: z.string().min(1).optional().or(z.literal('')),
  scopes: z.string().optional(),
  isActive: z.boolean().optional(),
});

type CreateProviderFormData = z.infer<typeof createProviderSchema>;
type UpdateProviderFormData = z.infer<typeof updateProviderSchema>;

export default function SsoProvidersPage() {
  const { data: providers, isLoading } = useOidcAdminProviders();
  const createProvider = useCreateOidcProvider();
  const updateProvider = useUpdateOidcProvider();
  const deleteProvider = useDeleteOidcProvider();
  const { data: ssoEnforceSetting } = useSsoEnforceSetting();
  const updateSsoEnforce = useUpdateSsoEnforce();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<OidcProviderResponseDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; name: string } | null>(null);

  const hasProviders = (providers?.length ?? 0) > 0;
  const ssoEnforceEnabled = !!(ssoEnforceSetting?.value as { enabled?: boolean } | null)?.enabled;

  const handleToggleSsoEnforce = async (enabled: boolean) => {
    try {
      await updateSsoEnforce.mutateAsync(enabled);
      toast({
        title: enabled ? t('oidcProviders.enforceEnabled') : t('oidcProviders.enforceDisabled'),
        description: enabled ? t('oidcProviders.enforceEnabledDesc') : t('oidcProviders.enforceDisabledDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('oidcProviders.enforceError');
      toast({
        title: t('oidcProviders.updateError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  // Create form
  const createForm = useForm<CreateProviderFormData>({
    resolver: zodResolver(createProviderSchema),
    defaultValues: {
      scopes: 'openid email profile',
      isActive: true,
    },
  });

  // Edit form
  const editForm = useForm<UpdateProviderFormData>({
    resolver: zodResolver(updateProviderSchema),
  });

  const handleCreate = async (data: CreateProviderFormData) => {
    try {
      await createProvider.mutateAsync({
        ...data,
        scopes: data.scopes || 'openid email profile',
        isActive: data.isActive ?? true,
      });
      setIsCreateOpen(false);
      createForm.reset({
        scopes: 'openid email profile',
        isActive: true,
        name: '',
        slug: '',
        discoveryUrl: '',
        clientId: '',
        clientSecret: '',
      });
      toast({
        title: t('oidcProviders.createSuccess'),
        description: t('oidcProviders.createSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('oidcProviders.createErrorFallback');
      toast({
        title: t('oidcProviders.createError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (provider: OidcProviderResponseDto) => {
    setEditProvider(provider);
    editForm.reset({
      name: provider.name,
      discoveryUrl: provider.discoveryUrl,
      clientId: provider.clientId,
      scopes: provider.scopes,
      isActive: provider.isActive,
      clientSecret: '',
    });
  };

  const handleUpdate = async (data: UpdateProviderFormData) => {
    if (!editProvider) return;

    try {
      const updateData = { ...data };
      if (!updateData.clientSecret) {
        delete updateData.clientSecret;
      }

      await updateProvider.mutateAsync({
        slug: editProvider.slug,
        data: updateData,
      });
      setEditProvider(null);
      toast({
        title: t('oidcProviders.updateSuccess'),
        description: t('oidcProviders.updateSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('oidcProviders.updateErrorFallback');
      toast({
        title: t('oidcProviders.updateError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await deleteProvider.mutateAsync(deleteTarget.slug);
      toast({
        title: t('oidcProviders.deleteSuccess'),
        description: t('oidcProviders.deleteSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('oidcProviders.deleteErrorFallback');
      toast({
        title: t('oidcProviders.deleteError'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">{t('oidcProviders.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('oidcProviders.description')}
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  {t('oidcProviders.listTitle')}
                </CardTitle>
                <CardDescription>
                  {hasProviders
                    ? t('oidcProviders.currentCount', { count: providers?.length || 0 })
                    : t('oidcProviders.noProviders')}
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('oidcProviders.addProvider')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loading text={t('common.loading')} />
              </div>
            ) : !hasProviders ? (
              <div className="text-center py-12">
                <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t('oidcProviders.noProviders')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('oidcProviders.noProvidersDesc')}
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('oidcProviders.addProvider')}
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('oidcProviders.providerName')}</TableHead>
                      <TableHead>{t('oidcProviders.slug')}</TableHead>
                      <TableHead className="text-center">{t('oidcProviders.status')}</TableHead>
                      <TableHead>{t('oidcProviders.discoveryUrl')}</TableHead>
                      <TableHead>{t('oidcProviders.clientId')}</TableHead>
                      <TableHead>{t('oidcProviders.createdAt')}</TableHead>
                      <TableHead className="text-right">{t('urls.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers!.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {provider.slug}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                            {provider.isActive ? t('common.enabled') : t('common.disabled')}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {provider.discoveryUrl}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate text-xs">
                          {provider.clientId}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(provider.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(provider)}
                              title={t('common.edit')}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget({ slug: provider.slug, name: provider.name })}
                              title={t('common.delete')}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SSO Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('oidcProviders.settingsTitle')}
            </CardTitle>
            <CardDescription>
              {t('oidcProviders.settingsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">{t('oidcProviders.enforceSsoLabel')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('oidcProviders.enforceSsoHint')}
                </p>
              </div>
              <Switch
                checked={ssoEnforceEnabled}
                onCheckedChange={handleToggleSsoEnforce}
                disabled={updateSsoEnforce.isPending}
              />
            </div>
            {ssoEnforceEnabled && !hasProviders && (
              <p className="mt-3 text-sm text-amber-500">
                {t('oidcProviders.enforceWarningNoProviders')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Provider Dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) createForm.reset({ scopes: 'openid email profile', isActive: true, name: '', slug: '', discoveryUrl: '', clientId: '', clientSecret: '' });
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('oidcProviders.createTitle')}</DialogTitle>
            <DialogDescription>{t('oidcProviders.createDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">{t('oidcProviders.providerName')}</Label>
                <Input
                  id="create-name"
                  placeholder={t('oidcProviders.namePlaceholder')}
                  {...createForm.register('name')}
                />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-slug">{t('oidcProviders.slug')}</Label>
                <Input
                  id="create-slug"
                  placeholder={t('oidcProviders.slugPlaceholder')}
                  {...createForm.register('slug')}
                />
                {createForm.formState.errors.slug && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.slug.message}</p>
                )}
                <p className="text-xs text-muted-foreground">{t('oidcProviders.slugHint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-discoveryUrl">{t('oidcProviders.discoveryUrl')}</Label>
                <Input
                  id="create-discoveryUrl"
                  placeholder={t('oidcProviders.discoveryUrlPlaceholder')}
                  {...createForm.register('discoveryUrl')}
                />
                {createForm.formState.errors.discoveryUrl && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.discoveryUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-clientId">{t('oidcProviders.clientId')}</Label>
                <Input
                  id="create-clientId"
                  placeholder={t('oidcProviders.clientIdPlaceholder')}
                  {...createForm.register('clientId')}
                />
                {createForm.formState.errors.clientId && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.clientId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-clientSecret">{t('oidcProviders.clientSecret')}</Label>
                <Input
                  id="create-clientSecret"
                  type="password"
                  placeholder={t('oidcProviders.clientSecretPlaceholder')}
                  {...createForm.register('clientSecret')}
                />
                {createForm.formState.errors.clientSecret && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.clientSecret.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-scopes">{t('oidcProviders.scopes')}</Label>
                <Input
                  id="create-scopes"
                  placeholder="openid email profile"
                  {...createForm.register('scopes')}
                />
                <p className="text-xs text-muted-foreground">{t('oidcProviders.scopesHint')}</p>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createProvider.isPending}>
                {createProvider.isPending ? t('common.loading') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Provider Dialog */}
      <Dialog
        open={!!editProvider}
        onOpenChange={(open) => {
          if (!open) setEditProvider(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('oidcProviders.editTitle')}</DialogTitle>
            <DialogDescription>
              {t('oidcProviders.editDescription')}
              {editProvider && (
                <span className="block mt-1">
                  Slug: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{editProvider.slug}</code>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleUpdate)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('oidcProviders.providerName')}</Label>
                <Input
                  id="edit-name"
                  placeholder={t('oidcProviders.namePlaceholder')}
                  {...editForm.register('name')}
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-discoveryUrl">{t('oidcProviders.discoveryUrl')}</Label>
                <Input
                  id="edit-discoveryUrl"
                  placeholder={t('oidcProviders.discoveryUrlPlaceholder')}
                  {...editForm.register('discoveryUrl')}
                />
                {editForm.formState.errors.discoveryUrl && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.discoveryUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-clientId">{t('oidcProviders.clientId')}</Label>
                <Input
                  id="edit-clientId"
                  placeholder={t('oidcProviders.clientIdPlaceholder')}
                  {...editForm.register('clientId')}
                />
                {editForm.formState.errors.clientId && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.clientId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-clientSecret">{t('oidcProviders.clientSecret')}</Label>
                <Input
                  id="edit-clientSecret"
                  type="password"
                  placeholder={t('oidcProviders.clientSecretUpdatePlaceholder')}
                  {...editForm.register('clientSecret')}
                />
                <p className="text-xs text-muted-foreground">{t('oidcProviders.clientSecretUpdateHint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-scopes">{t('oidcProviders.scopes')}</Label>
                <Input
                  id="edit-scopes"
                  placeholder="openid email profile"
                  {...editForm.register('scopes')}
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="edit-isActive"
                  checked={editForm.watch('isActive')}
                  onCheckedChange={(checked) => editForm.setValue('isActive', checked)}
                />
                <Label htmlFor="edit-isActive">{t('oidcProviders.activeLabel')}</Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditProvider(null)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={updateProvider.isPending}>
                {updateProvider.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('oidcProviders.deleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('oidcProviders.deleteConfirm').replace('{name}', deleteTarget?.name || '')}
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
