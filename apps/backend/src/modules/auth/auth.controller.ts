import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Put,
  UseGuards,
  Req,
  Res,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { Disable2FADto } from './dto/disable-2fa.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { Setup2FAResponseDto } from './dto/setup-2fa-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators';
import { SuccessResponseDto } from '@/common/dto/success-response.dto';
import { TurnstileService } from '../turnstile/turnstile.service';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly turnstileService: TurnstileService
  ) {}

  /**
   * Auto-detect cookie domain for cross-subdomain cookie sharing
   * @param req - The incoming request object
   * @returns Cookie domain string (e.g., '.example.com') or undefined
   */
  private getCookieDomain(req: any): string | undefined {
    // If manually configured, use it (allows override)
    if (process.env.COOKIE_DOMAIN) {
      return process.env.COOKIE_DOMAIN;
    }

    const frontendUrl = process.env.FRONTEND_URL;
    const currentHost = req.headers?.host || req.get?.('host');

    // Development environment or localhost: no domain needed
    if (!frontendUrl || !currentHost) {
      return undefined;
    }

    if (
      currentHost.includes('localhost') ||
      currentHost.includes('127.0.0.1')
    ) {
      return undefined;
    }

    try {
      const frontendHost = new URL(frontendUrl).hostname;
      const apiHost = currentHost.split(':')[0]; // Remove port if present

      // If frontend and backend are on the same domain, no domain needed
      if (frontendHost === apiHost) {
        return undefined;
      }

      // Extract root domain from frontend URL (e.g., app.example.com -> .example.com)
      const parts = frontendHost.split('.');
      if (parts.length >= 2) {
        const rootDomain = '.' + parts.slice(-2).join('.');
        return rootDomain;
      }
    } catch (error) {
      // URL parsing failed, skip domain setting
      console.warn('Failed to auto-detect cookie domain:', error);
    }

    return undefined;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Login',
    description:
      'Login to the system using email and password. Returns JWT Token upon successful authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT Token and user information',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
    schema: {
      example: {
        message: 'Invalid email or password',
        statusCode: 401,
        timestamp: '2025-10-17T09:08:52.000Z',
        path: '/api/auth/login',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters (e.g., incorrect format)',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() clientIp: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: any
  ): Promise<AuthResponseDto> {
    // Verify Turnstile token
    await this.turnstileService.verifyOrThrow(
      loginDto.turnstileToken,
      clientIp
    );

    // Continue with login flow
    const result = await this.authService.login(loginDto);

    // Set JWT as httpOnly cookie if login successful
    if (result.access_token) {
      const cookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/',
      };

      // Auto-detect and set domain for cross-subdomain cookie sharing
      const cookieDomain = this.getCookieDomain(req);
      if (cookieDomain) {
        cookieOptions.domain = cookieDomain;
      }

      res.cookie('access_token', result.access_token, cookieOptions);
    }

    // Return response without access_token (it's in cookie now)
    return {
      ...result,
      access_token: undefined,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User Logout',
    description:
      'Logout from the system. This will invalidate the current JWT token by adding it to the blacklist. Requires a valid JWT Token in the Authorization header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful, token has been revoked',
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (invalid or expired token)',
    schema: {
      example: {
        message: 'Unauthorized',
        statusCode: 401,
        timestamp: '2025-10-17T09:08:52.000Z',
        path: '/api/auth/logout',
      },
    },
  })
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: any
  ): Promise<SuccessResponseDto> {
    // Extract token from cookie first, then fallback to Authorization header
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.replace('Bearer ', '') ||
      '';

    // Clear cookie with same options as set cookie
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };

    // Auto-detect and set domain for cross-subdomain cookie sharing
    const cookieDomain = this.getCookieDomain(req);
    if (cookieDomain) {
      cookieOptions.domain = cookieDomain;
    }

    res.clearCookie('access_token', cookieOptions);

    return this.authService.logout(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Current User Information',
    description:
      'Retrieve detailed information of the currently logged-in user. Requires a valid JWT Token in the Authorization header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user information',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (invalid or expired token)',
    schema: {
      example: {
        message: 'Unauthorized',
        statusCode: 401,
        timestamp: '2025-10-17T09:08:52.000Z',
        path: '/api/auth/me',
      },
    },
  })
  async getCurrentUser(@CurrentUser() user: any): Promise<UserResponseDto> {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    };
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update Current User Profile',
    description:
      'Update the profile information (name only) of the currently logged-in user. Email cannot be changed. Requires a valid JWT Token in the Authorization header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (invalid or expired token)',
    schema: {
      example: {
        message: 'Unauthorized',
        statusCode: 401,
        timestamp: '2025-10-17T09:08:52.000Z',
        path: '/api/auth/me',
      },
    },
  })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.authService.updateProfile(user.id, updateUserDto);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change Password',
    description:
      'Change the password of the currently logged-in user. Requires the current password and a new password. Requires a valid JWT Token in the Authorization header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized (invalid or expired token, or incorrect current password)',
    schema: {
      example: {
        message: 'Current password is incorrect',
        statusCode: 401,
        timestamp: '2025-10-17T09:08:52.000Z',
        path: '/api/auth/password',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters (e.g., new password too short)',
  })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<SuccessResponseDto> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Setup Two-Factor Authentication',
    description:
      'Generate QR code and secret for setting up 2FA. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.).',
  })
  @ApiResponse({
    status: 200,
    description: 'QR code and secret generated successfully',
    type: Setup2FAResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '2FA already enabled',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async setup2FA(@CurrentUser() user: any): Promise<Setup2FAResponseDto> {
    return this.authService.setup2FA(user.id);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Enable Two-Factor Authentication',
    description:
      'Verify the TOTP code from authenticator app and enable 2FA for your account.',
  })
  @ApiResponse({
    status: 200,
    description: '2FA enabled successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '2FA already enabled or not set up',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid verification code',
  })
  async enable2FA(
    @CurrentUser() user: any,
    @Body() verify2FADto: Verify2FADto
  ): Promise<SuccessResponseDto> {
    return this.authService.enable2FA(user.id, verify2FADto);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Disable Two-Factor Authentication',
    description:
      'Disable 2FA for your account. Requires current password and valid TOTP code for security.',
  })
  @ApiResponse({
    status: 200,
    description: '2FA disabled successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '2FA not enabled',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid password or verification code',
  })
  async disable2FA(
    @CurrentUser() user: any,
    @Body() disable2FADto: Disable2FADto
  ): Promise<SuccessResponseDto> {
    return this.authService.disable2FA(user.id, disable2FADto);
  }
}
