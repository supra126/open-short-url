import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RequestMeta } from '@/common/decorators/request-meta.decorator';
import { Prisma, UserRole } from '@prisma/client';
import { hashPassword } from '@/common/utils';
import { buildPaginatedResponse } from '@/common/dto';
import {
  UserListQueryDto,
  UserResponseDto,
  UserListResponseDto,
  CreateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  UpdateUserNameDto,
  ResetPasswordDto,
  OidcAccountResponseDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Create a new user (Admin only)
   */
  async createUser(
    createUserDto: CreateUserDto,
    adminUserId: string,
    meta?: RequestMeta,
  ): Promise<UserResponseDto> {
    const { email, password, name, role } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: role || UserRole.USER,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await this.auditLogService.create({
      userId: adminUserId,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: user.id,
      newValue: { email, name, role: user.role },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.mapUserResponse(user);
  }

  /**
   * Get users list with pagination, search, and filters
   */
  async getUsers(query: UserListQueryDto): Promise<UserListResponseDto> {
    const { page = 1, pageSize = 10, search, role, isActive } = query;
    const skip = (page - 1) * pageSize;

    // Build query conditions
    const where: Prisma.UserWhereInput = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Filter by status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get total count and users list in parallel for better performance
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          twoFactorEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return buildPaginatedResponse(
      users.map((user) => this.mapUserResponse(user)),
      total,
      page,
      pageSize,
    );
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserResponse(user);
  }

  /**
   * Update user role
   */
  async updateUserRole(
    userId: string,
    updateRoleDto: UpdateUserRoleDto,
    currentUserId: string,
    meta?: RequestMeta,
  ): Promise<UserResponseDto> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent modifying your own role
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot modify your own role');
    }

    const oldRole = user.role;

    // Update role
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: updateRoleDto.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await this.auditLogService.create({
      userId: currentUserId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: userId,
      oldValue: { role: oldRole },
      newValue: { role: updateRoleDto.role },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.mapUserResponse(updatedUser);
  }

  /**
   * Update user account status
   */
  async updateUserStatus(
    userId: string,
    updateStatusDto: UpdateUserStatusDto,
    currentUserId: string,
    meta?: RequestMeta,
  ): Promise<UserResponseDto> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deactivating your own account
    if (userId === currentUserId && !updateStatusDto.isActive) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    const oldStatus = user.isActive;

    // Update status
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: updateStatusDto.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await this.auditLogService.create({
      userId: currentUserId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: userId,
      oldValue: { isActive: oldStatus },
      newValue: { isActive: updateStatusDto.isActive },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.mapUserResponse(updatedUser);
  }

  /**
   * Delete user
   */
  async deleteUser(
    userId: string,
    currentUserId: string,
    meta?: RequestMeta,
  ): Promise<void> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deleting yourself
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Delete user (Cascade will automatically delete related data)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    // Audit log
    await this.auditLogService.create({
      userId: currentUserId,
      action: 'USER_DELETED',
      entityType: 'user',
      entityId: userId,
      oldValue: { email: user.email, name: user.name, role: user.role },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  /**
   * Reset user password (Admin)
   */
  async resetUserPassword(
    userId: string,
    resetPasswordDto: ResetPasswordDto,
    adminUserId: string,
    meta?: RequestMeta,
  ): Promise<void> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await hashPassword(resetPasswordDto.newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Audit log (password is redacted for security)
    await this.auditLogService.create({
      userId: adminUserId,
      action: 'PASSWORD_CHANGED',
      entityType: 'user',
      entityId: userId,
      newValue: { password: '[REDACTED]' },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  /**
   * Update user name
   */
  async updateUserName(
    userId: string,
    updateNameDto: UpdateUserNameDto,
    adminUserId: string,
    meta?: RequestMeta,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldName = user.name;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { name: updateNameDto.name || null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditLogService.create({
      userId: adminUserId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: userId,
      oldValue: { name: oldName },
      newValue: { name: updateNameDto.name },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.mapUserResponse(updatedUser);
  }

  /**
   * Admin disable 2FA for a user
   */
  async adminDisable2FA(
    userId: string,
    adminUserId: string,
    meta?: RequestMeta,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled for this user');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditLogService.create({
      userId: adminUserId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: userId,
      oldValue: { twoFactorEnabled: true },
      newValue: { twoFactorEnabled: false, disabledBy: 'admin' },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.mapUserResponse(updatedUser);
  }

  /**
   * Get user's OIDC accounts (SSO links)
   */
  async getUserOidcAccounts(userId: string): Promise<OidcAccountResponseDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accounts = await this.prisma.oidcAccount.findMany({
      where: { userId },
      include: {
        provider: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((account) => ({
      id: account.id,
      providerId: account.providerId,
      sub: account.sub,
      userId: account.userId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      provider: {
        name: account.provider.name,
        slug: account.provider.slug,
      },
    }));
  }

  /**
   * Delete user's OIDC account link
   */
  async deleteUserOidcAccount(
    userId: string,
    accountId: string,
    adminUserId: string,
    meta?: RequestMeta,
  ): Promise<void> {
    const account = await this.prisma.oidcAccount.findFirst({
      where: { id: accountId, userId },
      include: {
        provider: { select: { name: true, slug: true } },
      },
    });

    if (!account) {
      throw new NotFoundException('OIDC account link not found');
    }

    await this.prisma.oidcAccount.delete({
      where: { id: accountId },
    });

    await this.auditLogService.create({
      userId: adminUserId,
      action: 'OIDC_ACCOUNT_UNLINKED',
      entityType: 'oidc_account',
      entityId: accountId,
      oldValue: {
        providerId: account.provider.slug,
        sub: account.sub,
        userId,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  /**
   * Map user to response DTO
   */
  private mapUserResponse(user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    isActive: boolean;
    twoFactorEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
      isActive: user.isActive,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
