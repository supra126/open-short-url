import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';
import { UserRole } from '@prisma/client';
import { hashPassword } from '@/common/utils';
import {
  UserListQueryDto,
  UserResponseDto,
  UserListResponseDto,
  CreateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  ResetPasswordDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user (Admin only)
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
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

    return this.mapUserResponse(user);
  }

  /**
   * Get users list with pagination, search, and filters
   */
  async getUsers(query: UserListQueryDto): Promise<UserListResponseDto> {
    const { page = 1, limit = 10, search, role, isActive } = query;
    const skip = (page - 1) * limit;

    // Build query conditions
    const where: any = {};

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

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Query users list
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
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
    });

    return {
      users: users.map((user) => this.mapUserResponse(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

    return this.mapUserResponse(updatedUser);
  }

  /**
   * Update user account status
   */
  async updateUserStatus(
    userId: string,
    updateStatusDto: UpdateUserStatusDto,
    currentUserId: string,
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

    return this.mapUserResponse(updatedUser);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string, currentUserId: string): Promise<void> {
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
  }

  /**
   * Reset user password (Admin)
   */
  async resetUserPassword(
    userId: string,
    resetPasswordDto: ResetPasswordDto,
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
  }

  /**
   * Map user to response DTO
   */
  private mapUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
