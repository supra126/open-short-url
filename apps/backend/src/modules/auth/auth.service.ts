import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/common/database/prisma.service';
import { hashPassword, comparePassword } from '@/common/utils';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { Disable2FADto } from './dto/disable-2fa.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { Setup2FAResponseDto } from './dto/setup-2fa-response.dto';
import { SuccessResponseDto } from '@/common/dto/success-response.dto';
import { TokenBlacklistService } from './services/token-blacklist.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService
  ) {}

  /**
   * User login
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password, twoFactorCode } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // If 2FA code is not provided, request it
      if (!twoFactorCode) {
        // Generate temporary token (5 minutes validity)
        const tempPayload = {
          sub: user.id,
          type: '2fa-pending',
          email: user.email,
        };
        const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '5m' });

        return {
          requires2FA: true,
          tempToken,
        };
      }

      // Verify 2FA code
      const is2FAValid = await this.verify2FA(user.id, twoFactorCode);
      if (!is2FAValid) {
        throw new UnauthorizedException('Invalid verification code');
      }
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      requires2FA: false,
      access_token,
      user: this.mapUserResponse(user),
    };
  }

  /**
   * User logout
   */
  async logout(token: string): Promise<SuccessResponseDto> {
    // Decode token to get expiration time
    try {
      const decoded = this.jwtService.decode(token) as any;
      const expiresAt = decoded?.exp ? decoded.exp * 1000 : undefined;

      // Add token to blacklist
      await this.tokenBlacklistService.addToBlacklist(token, expiresAt);

      return {
        message: 'Logout successful',
        statusCode: 200,
      };
    } catch (error) {
      // Add token to blacklist even if decoding fails (using default expiration time)
      await this.tokenBlacklistService.addToBlacklist(token);
      return {
        message: 'Logout successful',
        statusCode: 200,
      };
    }
  }

  /**
   * Validate user (used by JWT Strategy)
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const { name } = updateUserDto;

    // Update user data (name only)
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
      },
    });

    return this.mapUserResponse(user);
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<SuccessResponseDto> {
    const { oldPassword, newPassword } = changePasswordDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password changed successfully',
      statusCode: 200,
    };
  }

  /**
   * Setup two-factor authentication (generate QR code and secret)
   */
  async setup2FA(userId: string): Promise<Setup2FAResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Open Short URL (${user.email})`,
      issuer: 'Open Short URL',
    });

    // Save secret (not yet enabled)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      qrCode,
      secret: secret.base32!,
      accountName: user.email,
    };
  }

  /**
   * Enable two-factor authentication (verify TOTP code)
   */
  async enable2FA(
    userId: string,
    verify2FADto: Verify2FADto,
  ): Promise<SuccessResponseDto> {
    const { code } = verify2FADto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Please set up two-factor authentication first');
    }

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time windows before and after
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Enable two-factor authentication
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return {
      message: 'Two-factor authentication enabled successfully',
      statusCode: 200,
    };
  }

  /**
   * Disable two-factor authentication
   */
  async disable2FA(
    userId: string,
    disable2FADto: Disable2FADto,
  ): Promise<SuccessResponseDto> {
    const { password, code } = disable2FADto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Verify TOTP code
    const isCodeValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Disable two-factor authentication and clear secret
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return {
      message: 'Two-factor authentication disabled successfully',
      statusCode: 200,
    };
  }

  /**
   * Verify two-factor authentication code (for login)
   */
  async verify2FA(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
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
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    };
  }
}
