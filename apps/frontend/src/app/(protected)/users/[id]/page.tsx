'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useUser,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUpdateUserName,
  useResetUserPassword,
  useDeleteUser,
  useAdminDisable2FA,
  useUserOidcAccounts,
  useDeleteUserOidcAccount,
  UserRole,
  type OidcAccountResponseDto,
} from '@/hooks/use-users';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Loader2,
  User,
  Shield,
  ShieldCheck,
  Key,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Unlink,
  AlertTriangle,
} from 'lucide-react';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  // Data hooks
  const { data: user, isPending, error } = useUser(id);
  const { data: oidcAccounts } = useUserOidcAccounts(id);

  // Mutation hooks
  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();
  const updateNameMutation = useUpdateUserName();
  const resetPasswordMutation = useResetUserPassword();
  const deleteMutation = useDeleteUser();
  const disable2FAMutation = useAdminDisable2FA();
  const unlinkOidcMutation = useDeleteUserOidcAccount();

  // Dialog states
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [disable2FAOpen, setDisable2FAOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<OidcAccountResponseDto | null>(null);

  // Handlers
  const handleUpdateRole = async (role: UserRole) => {
    try {
      await updateRoleMutation.mutateAsync({ id, data: { role } });
      toast({
        title: t('users.updateRoleSuccess'),
        description: t('users.updateRoleSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.updateRoleErrorFallback');
      toast({ title: t('users.updateRoleError'), description: message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    try {
      await updateStatusMutation.mutateAsync({ id, data: { isActive: !user.isActive } });
      toast({
        title: t('users.updateStatusSuccess'),
        description: user.isActive ? t('users.deactivateSuccessDesc') : t('users.activateSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.updateStatusErrorFallback');
      toast({ title: t('users.updateStatusError'), description: message, variant: 'destructive' });
    }
  };

  const handleEditName = () => {
    setEditNameValue(user?.name || '');
    setEditNameOpen(true);
  };

  const handleSaveName = async () => {
    try {
      await updateNameMutation.mutateAsync({ id, data: { name: editNameValue } });
      setEditNameOpen(false);
      toast({
        title: t('users.nameSaveSuccess'),
        description: t('users.nameSaveSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.nameSaveError');
      toast({ title: t('users.nameSaveError'), description: message, variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) return;
    try {
      await resetPasswordMutation.mutateAsync({ id, data: { newPassword } });
      setResetPasswordOpen(false);
      setNewPassword('');
      toast({
        title: t('users.resetPasswordSuccess'),
        description: t('users.resetPasswordSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.resetPasswordErrorFallback');
      toast({ title: t('users.resetPasswordError'), description: message, variant: 'destructive' });
    }
  };

  const handleDisable2FA = async () => {
    try {
      await disable2FAMutation.mutateAsync(id);
      setDisable2FAOpen(false);
      toast({
        title: t('users.disable2FASuccess'),
        description: t('users.disable2FASuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.disable2FAError');
      toast({ title: t('users.disable2FAError'), description: message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: t('users.deleteSuccess'),
        description: t('users.deleteSuccessDesc'),
      });
      router.push('/users');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.deleteErrorFallback');
      toast({ title: t('users.deleteError'), description: message, variant: 'destructive' });
    } finally {
      setDeleteOpen(false);
    }
  };

  const handleUnlinkOidc = async () => {
    if (!unlinkTarget) return;
    try {
      await unlinkOidcMutation.mutateAsync({ userId: id, accountId: unlinkTarget.id });
      toast({
        title: t('users.unlinkSsoSuccess'),
        description: t('users.unlinkSsoSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.unlinkSsoError');
      toast({ title: t('users.unlinkSsoError'), description: message, variant: 'destructive' });
    } finally {
      setUnlinkTarget(null);
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/users">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold">{t('users.detail')}</h1>
              <p className="text-muted-foreground mt-1">{t('users.detailDesc')}</p>
            </div>
          </div>
        </div>

        {/* Loading / Error / Content */}
        {isPending ? (
          <div className="flex h-75 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error || !user ? (
          <div className="flex h-75 flex-col items-center justify-center gap-4">
            <p className="text-lg text-muted-foreground">{t('users.notFound')}</p>
            <Link href="/users">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('users.backToList')}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {t('users.basicInfo')}
                    </CardTitle>
                    <CardDescription>{t('users.basicInfoDesc')}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleEditName}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('users.editName')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">{t('users.tableEmail')}</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">{t('users.nameLabel')}</Label>
                    <p className="font-medium">{user.name || t('common.noValue')}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">{t('users.tableRole')}</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleUpdateRole(value as UserRole)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.ADMIN}>{t('users.roleAdmin')}</SelectItem>
                          <SelectItem value={UserRole.USER}>{t('users.roleUser')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">{t('users.tableStatus')}</Label>
                    <div className="flex items-center gap-2">
                      {user.isActive ? (
                        <Badge variant="outline" className="text-success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {t('users.statusActive')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          {t('users.statusInactive')}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleStatus}
                        disabled={updateStatusMutation.isPending}
                      >
                        {user.isActive ? t('users.deactivate') : t('users.activate')}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">{t('users.tableCreatedAt')}</Label>
                    <p className="text-sm">{formatDateTime(user.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('users.security')}
                </CardTitle>
                <CardDescription>{t('users.securityDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 2FA */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">{t('users.twoFactorAuth')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {user.twoFactorEnabled ? t('users.twoFactorEnabled') : t('users.twoFactorDisabled')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.twoFactorEnabled ? 'default' : 'secondary'}>
                      {user.twoFactorEnabled ? t('common.enabled') : t('common.disabled')}
                    </Badge>
                    {user.twoFactorEnabled && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDisable2FAOpen(true)}
                      >
                        {t('users.disable2FA')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Reset Password */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">{t('users.resetPassword')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('users.resetPasswordDescription')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResetPasswordOpen(true)}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    {t('users.resetPassword')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SSO Linked Accounts Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  {t('users.ssoLinks')}
                </CardTitle>
                <CardDescription>{t('users.ssoLinksDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {!oidcAccounts || oidcAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium">{t('users.noSsoLinks')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('users.noSsoLinksDesc')}</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('users.ssoProvider')}</TableHead>
                          <TableHead>{t('users.ssoSubject')}</TableHead>
                          <TableHead>{t('users.ssoLinkedAt')}</TableHead>
                          <TableHead className="text-right">{t('urls.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {oidcAccounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.provider.name}</TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {account.sub}
                              </code>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateTime(account.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUnlinkTarget(account)}
                              >
                                <Unlink className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone Card */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  {t('users.dangerZone')}
                </CardTitle>
                <CardDescription>{t('users.dangerZoneDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">{t('users.delete')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('users.deleteDescription')}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('users.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.editNameTitle')}</DialogTitle>
            <DialogDescription>{t('users.editNameDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('users.nameLabel')}</Label>
              <Input
                id="edit-name"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                placeholder={t('users.namePlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNameOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveName} disabled={updateNameMutation.isPending}>
              {updateNameMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordOpen}
        onOpenChange={(open) => {
          setResetPasswordOpen(open);
          if (!open) setNewPassword('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.resetPasswordTitle')}</DialogTitle>
            <DialogDescription>{t('users.resetPasswordDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('users.newPassword')}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('users.newPasswordPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPasswordOpen(false); setNewPassword(''); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={!newPassword || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? t('common.saving') : t('users.resetPasswordButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Confirmation */}
      <AlertDialog open={disable2FAOpen} onOpenChange={setDisable2FAOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.disable2FATitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('users.disable2FAConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable2FA}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('users.disable2FA')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.deleteConfirm')} <strong>{user?.email}</strong>?
              <br />
              <span className="text-destructive">{t('users.deleteWarning')}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink SSO Confirmation */}
      <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => { if (!open) setUnlinkTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.unlinkSsoTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.unlinkSsoConfirm').replace('{provider}', unlinkTarget?.provider.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkOidc}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('users.unlinkSso')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
