'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  useCurrentUser,
  useUpdateProfile,
  useChangePassword,
} from '@/hooks/use-auth';
import { useSetup2FA, useEnable2FA, useDisable2FA } from '@/hooks/use-2fa';
import { User, Mail, Calendar, Loader2, Lock, Shield } from 'lucide-react';
import Image from 'next/image';
import { t } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { toast } = useToast();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const setup2FA = useSetup2FA();
  const enable2FA = useEnable2FA();
  const disable2FA = useDisable2FA();

  const [name, setName] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Two-factor authentication related state
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isDisable2FADialogOpen, setIsDisable2FADialogOpen] = useState(false);
  const [disable2FAData, setDisable2FAData] = useState({
    password: '',
    code: '',
  });

  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile.mutateAsync({ name });

      toast({
        title: t('profile.updateSuccess'),
        description: t('profile.updateSuccessDesc'),
      });
    } catch (error) {
      toast({
        title: t('profile.updateError'),
        description:
          error instanceof Error ? error.message : t('profile.updateErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate new password
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: t('profile.passwordMismatch'),
        description: t('profile.passwordMismatchDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: t('profile.passwordTooShort'),
        description: t('profile.passwordTooShortDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await changePassword.mutateAsync({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      toast({
        title: t('profile.changePasswordSuccess'),
        description: t('profile.changePasswordSuccessDesc'),
      });

      // Close dialog and clear form
      setIsPasswordDialogOpen(false);
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: t('profile.changePasswordError'),
        description:
          error instanceof Error
            ? error.message
            : t('profile.changePasswordErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  // Setup two-factor authentication
  const handleSetup2FA = async () => {
    try {
      const data = await setup2FA.mutateAsync();
      setQrCodeData(data.qrCode);
      setSecret(data.secret);
      setIs2FADialogOpen(true);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      });
    }
  };

  // Enable two-factor authentication
  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await enable2FA.mutateAsync({ code: verificationCode });

      toast({
        title: t('common.success'),
        description: t('common.success'),
      });

      // Close dialog and clear form
      setIs2FADialogOpen(false);
      setVerificationCode('');
      setQrCodeData('');
      setSecret('');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      });
    }
  };

  // Disable two-factor authentication
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    if (disable2FAData.code.length !== 6) {
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await disable2FA.mutateAsync({
        password: disable2FAData.password,
        code: disable2FAData.code,
      });

      toast({
        title: t('common.success'),
        description: t('common.success'),
      });

      // Close dialog and clear form
      setIsDisable2FADialogOpen(false);
      setDisable2FAData({
        password: '',
        code: '',
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      });
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('profile.description')}</p>
      </div>

      {/* Profile Information */}
      <div className="space-y-6">
        <Card>
        <CardHeader>
          <CardTitle>{t('profile.basicInfo')}</CardTitle>
          <CardDescription>{t('profile.basicInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{t('profile.nameLabel')}</span>
                </div>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder={t('profile.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{t('profile.emailLabel')}</span>
                </div>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t('profile.emailPlaceholder')}
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="createdAt">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{t('profile.registrationDate')}</span>
                </div>
              </Label>
              <Input
                id="createdAt"
                type="text"
                value={
                  user?.createdAt
                    ? formatDate(user.createdAt)
                    : '-'
                }
                disabled
                className="bg-muted"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('profile.saveChanges')}
              </Button>
            </div>
          </form>
        </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
        <CardHeader>
          <CardTitle>{t('profile.security')}</CardTitle>
          <CardDescription>{t('profile.securityDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('profile.changePassword')}</p>
              <p className="text-sm text-muted-foreground">
                {t('profile.changePasswordDesc')}
              </p>
            </div>
            <Dialog
              open={isPasswordDialogOpen}
              onOpenChange={setIsPasswordDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Lock className="mr-2 h-4 w-4" />
                  {t('profile.changePassword')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleChangePassword}>
                  <DialogHeader>
                    <DialogTitle>
                      {t('profile.changePasswordTitle')}
                    </DialogTitle>
                    <DialogDescription>
                      {t('profile.changePasswordDialogDesc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="oldPassword">
                        {t('profile.currentPassword')}
                      </Label>
                      <Input
                        id="oldPassword"
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            oldPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">
                        {t('profile.newPassword')}
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        minLength={8}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('profile.newPasswordHint')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        {t('profile.confirmNewPassword')}
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        minLength={8}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={changePassword.isPending}>
                      {changePassword.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t('profile.confirmChange')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium">{t('profile.twoFactorAuth')}</p>
              <p className="text-sm text-muted-foreground">
                {user?.twoFactorEnabled
                  ? t('profile.twoFactorAuth')
                  : t('profile.twoFactorAuthDesc')}
              </p>
            </div>
            {user?.twoFactorEnabled ? (
              <Dialog
                open={isDisable2FADialogOpen}
                onOpenChange={setIsDisable2FADialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    {t('common.cancel')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleDisable2FA}>
                    <DialogHeader>
                      <DialogTitle>{t('profile.twoFactorAuth')}</DialogTitle>
                      <DialogDescription>
                        {t('profile.twoFactorAuthDesc')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="disable-password">
                          {t('common.password')}
                        </Label>
                        <Input
                          id="disable-password"
                          type="password"
                          value={disable2FAData.password}
                          onChange={(e) =>
                            setDisable2FAData({
                              ...disable2FAData,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="disable-code">
                          {t('auth.verificationCode')}
                        </Label>
                        <Input
                          id="disable-code"
                          type="text"
                          placeholder={t('profile.verificationCodePlaceholder')}
                          maxLength={6}
                          value={disable2FAData.code}
                          onChange={(e) =>
                            setDisable2FAData({
                              ...disable2FAData,
                              code: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDisable2FADialogOpen(false)}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={disable2FA.isPending}
                      >
                        {disable2FA.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t('profile.twoFactorAuth')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleSetup2FA}
                  disabled={setup2FA.isPending}
                >
                  {setup2FA.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Shield className="mr-2 h-4 w-4" />
                  {t('profile.twoFactorAuth')}
                </Button>

                {/* Enable 2FA Dialog */}
                <Dialog
                  open={is2FADialogOpen}
                  onOpenChange={setIs2FADialogOpen}
                >
                  <DialogContent className="max-w-md">
                    <form onSubmit={handleEnable2FA}>
                      <DialogHeader>
                        <DialogTitle>{t('profile.twoFactorAuth')}</DialogTitle>
                        <DialogDescription>
                          {t('profile.twoFactorAuthDesc')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {/* QR Code */}
                        {qrCodeData && (
                          <div className="flex flex-col items-center space-y-2">
                            <div className="border rounded-lg p-4 bg-white">
                              <Image
                                src={qrCodeData}
                                alt="QR Code"
                                width={200}
                                height={200}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                              {t('profile.twoFactorAuthDesc')}
                              <br />
                              <code className="bg-muted px-2 py-1 rounded text-xs">
                                {secret}
                              </code>
                            </p>
                          </div>
                        )}

                        {/* Verification Code Input */}
                        <div className="space-y-2">
                          <Label htmlFor="verification-code">
                            {t('auth.verificationCode')}
                          </Label>
                          <Input
                            id="verification-code"
                            type="text"
                            placeholder={t('profile.verificationCodePlaceholder')}
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) =>
                              setVerificationCode(e.target.value)
                            }
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            {t('profile.twoFactorAuthDesc')}
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIs2FADialogOpen(false);
                            setVerificationCode('');
                            setQrCodeData('');
                            setSecret('');
                          }}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            enable2FA.isPending || verificationCode.length !== 6
                          }
                        >
                          {enable2FA.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {t('profile.confirmChange')}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
