'use client';

import { useState } from 'react';
import {
  useUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
  useDeleteUser,
  useResetUserPassword,
  useCreateUser,
  UserRole,
  User,
  CreateUserDto,
} from '@/hooks/use-users';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreVertical,
  Shield,
  UserX,
  Trash2,
  Key,
  CheckCircle,
  XCircle,
  UserPlus,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { Loading } from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>();

  const { data, isLoading } = useUsers({
    page,
    pageSize: 10,
    search: search || undefined,
    role: roleFilter,
    isActive: statusFilter,
  });

  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();
  const deleteMutation = useDeleteUser();
  const resetPasswordMutation = useResetUserPassword();
  const createUserMutation = useCreateUser();

  // Dialog states
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createUserData, setCreateUserData] = useState<CreateUserDto>({
    email: '',
    password: '',
    name: '',
    role: UserRole.USER,
  });

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      await updateRoleMutation.mutateAsync({ id: userId, data: { role } });
      setEditUser(null);
      toast({
        title: t('users.updateRoleSuccess'),
        description: t('users.updateRoleSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.updateRoleErrorFallback');
      toast({
        title: t('users.updateRoleError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: userId,
        data: { isActive },
      });
      toast({
        title: t('users.updateStatusSuccess'),
        description: isActive
          ? t('users.activateSuccessDesc')
          : t('users.deactivateSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.updateStatusErrorFallback');
      toast({
        title: t('users.updateStatusError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    try {
      await deleteMutation.mutateAsync(deleteUser.id);
      setDeleteUser(null);
      toast({
        title: t('users.deleteSuccess'),
        description: t('users.deleteSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.deleteErrorFallback');
      toast({
        title: t('users.deleteError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;
    try {
      await resetPasswordMutation.mutateAsync({
        id: resetPasswordUser.id,
        data: { newPassword },
      });
      setResetPasswordUser(null);
      setNewPassword('');
      toast({
        title: t('users.resetPasswordSuccess'),
        description: t('users.resetPasswordSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.resetPasswordErrorFallback');
      toast({
        title: t('users.resetPasswordError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateUser = async () => {
    if (!createUserData.email || !createUserData.password) return;
    try {
      await createUserMutation.mutateAsync(createUserData);
      setShowCreateDialog(false);
      setCreateUserData({
        email: '',
        password: '',
        name: '',
        role: UserRole.USER,
      });
      toast({
        title: t('users.createSuccess'),
        description: t('users.createSuccessDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('users.createErrorFallback');
      toast({
        title: t('users.createError'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('users.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('users.description')}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('users.createUser')}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Filters */}
        <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('users.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={roleFilter || 'all'}
          onValueChange={(value) =>
            setRoleFilter(value === 'all' ? undefined : (value as UserRole))
          }
        >
          <SelectTrigger className="w-45">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('users.allRoles')}</SelectItem>
            <SelectItem value={UserRole.ADMIN}>
              {t('users.roleAdmin')}
            </SelectItem>
            <SelectItem value={UserRole.USER}>{t('users.roleUser')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={
            statusFilter === undefined
              ? 'all'
              : statusFilter
                ? 'active'
                : 'inactive'
          }
          onValueChange={(value) =>
            setStatusFilter(
              value === 'all' ? undefined : value === 'active' ? true : false
            )
          }
        >
          <SelectTrigger className="w-45">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('users.allStatus')}</SelectItem>
            <SelectItem value="active">{t('users.statusActive')}</SelectItem>
            <SelectItem value="inactive">
              {t('users.statusInactive')}
            </SelectItem>
          </SelectContent>
        </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('users.tableEmail')}</TableHead>
              <TableHead>{t('users.tableName')}</TableHead>
              <TableHead>{t('users.tableRole')}</TableHead>
              <TableHead>{t('users.tableStatus')}</TableHead>
              <TableHead>{t('users.table2FA')}</TableHead>
              <TableHead>{t('users.tableCreatedAt')}</TableHead>
              <TableHead className="w-12.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loading />
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  {t('users.noUsers')}
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name || t('common.noValue')}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === UserRole.ADMIN ? 'default' : 'secondary'
                      }
                    >
                      {user.role === UserRole.ADMIN
                        ? t('users.roleAdmin')
                        : t('users.roleUser')}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    {user.twoFactorEnabled
                      ? t('common.enabled')
                      : t('common.disabled')}
                  </TableCell>
                  <TableCell>
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditUser(user)}>
                          <Shield className="mr-2 h-4 w-4" />
                          {t('users.changeRole')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleStatus(user.id, !user.isActive)
                          }
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              {t('users.deactivate')}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {t('users.activate')}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setResetPasswordUser(user)}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          {t('users.resetPassword')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteUser(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('users.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            {t('common.page')} {page} {t('common.of')} {data.totalPages}（{t('common.total')} {data.total} {t('common.items')}）
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              {t('common.previous')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === data.totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.changeRoleTitle')}</DialogTitle>
            <DialogDescription>
              {t('users.changeRoleDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('users.tableEmail')}</Label>
              <p className="text-sm text-muted-foreground">{editUser?.email}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('users.tableRole')}</Label>
              <Select
                defaultValue={editUser?.role}
                onValueChange={(value) =>
                  editUser && handleUpdateRole(editUser.id, value as UserRole)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.ADMIN}>
                    {t('users.roleAdmin')}
                  </SelectItem>
                  <SelectItem value={UserRole.USER}>
                    {t('users.roleUser')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('users.deleteDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm">
              {t('users.deleteConfirm')} <strong>{deleteUser?.email}</strong>?
            </p>
            <p className="text-sm text-destructive">{t('users.deleteWarning')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t('common.deleting')
                : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetPasswordUser}
        onOpenChange={() => {
          setResetPasswordUser(null);
          setNewPassword('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.resetPasswordTitle')}</DialogTitle>
            <DialogDescription>
              {t('users.resetPasswordDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('users.tableEmail')}</Label>
              <p className="text-sm text-muted-foreground">
                {resetPasswordUser?.email}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('users.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('users.newPasswordPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordUser(null);
                setNewPassword('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={!newPassword || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending
                ? t('common.saving')
                : t('users.resetPasswordButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={() => {
          setShowCreateDialog(false);
          setCreateUserData({
            email: '',
            password: '',
            name: '',
            role: UserRole.USER,
          });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.createUserTitle')}</DialogTitle>
            <DialogDescription>
              {t('users.createUserDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('users.tableEmail')}</Label>
              <Input
                id="email"
                type="email"
                value={createUserData.email}
                onChange={(e) =>
                  setCreateUserData({
                    ...createUserData,
                    email: e.target.value,
                  })
                }
                placeholder={t('users.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('users.password')}</Label>
              <Input
                id="password"
                type="password"
                value={createUserData.password}
                onChange={(e) =>
                  setCreateUserData({
                    ...createUserData,
                    password: e.target.value,
                  })
                }
                placeholder={t('users.passwordPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('users.tableName')}</Label>
              <Input
                id="name"
                type="text"
                value={createUserData.name}
                onChange={(e) =>
                  setCreateUserData({ ...createUserData, name: e.target.value })
                }
                placeholder={t('users.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t('users.tableRole')}</Label>
              <Select
                value={createUserData.role}
                onValueChange={(value) =>
                  setCreateUserData({
                    ...createUserData,
                    role: value as UserRole,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.USER}>
                    {t('users.roleUser')}
                  </SelectItem>
                  <SelectItem value={UserRole.ADMIN}>
                    {t('users.roleAdmin')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setCreateUserData({
                  email: '',
                  password: '',
                  name: '',
                  role: UserRole.USER,
                });
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={
                !createUserData.email ||
                !createUserData.password ||
                createUserMutation.isPending
              }
            >
              {createUserMutation.isPending
                ? t('common.creating')
                : t('users.createUserButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
