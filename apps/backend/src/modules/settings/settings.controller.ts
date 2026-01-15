import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { SystemSettingsResponseDto } from './dto/system-settings.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { User, UserRole } from '@prisma/client';

@ApiTags('Settings')
@Controller('api/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get all system settings (ADMIN only)
   */
  @Get('system')
  @ApiOperation({
    summary: 'Get all system settings',
    description: 'Retrieve all system settings (admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
    type: [SystemSettingsResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (admin role required)',
    type: ErrorResponseDto,
  })
  async getAllSystemSettings(
    @CurrentUser() _user: User,
  ): Promise<SystemSettingsResponseDto[]> {
    return this.settingsService.getAllSystemSettings();
  }

  /**
   * Get single system setting (ADMIN only)
   */
  @Get('system/:key')
  @ApiOperation({
    summary: 'Get system setting',
    description: 'Retrieve system setting by key (admin only)',
  })
  @ApiParam({
    name: 'key',
    description: 'Setting key',
    example: 'allow_registration',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
    type: SystemSettingsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Setting not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (admin role required)',
    type: ErrorResponseDto,
  })
  async getSystemSetting(
    @Param('key') key: string,
  ): Promise<SystemSettingsResponseDto | null> {
    return this.settingsService.getSystemSetting(key);
  }

  /**
   * Update system setting (ADMIN only)
   */
  @Put('system/:key')
  @ApiOperation({
    summary: 'Update system setting',
    description: 'Update or create system setting (admin only)',
  })
  @ApiParam({
    name: 'key',
    description: 'Setting key',
    example: 'allow_registration',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Updated successfully',
    type: SystemSettingsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (admin role required)',
    type: ErrorResponseDto,
  })
  async updateSystemSetting(
    @Param('key') key: string,
    @Body() body: { value: unknown; description?: string },
  ): Promise<SystemSettingsResponseDto> {
    return this.settingsService.updateSystemSetting(
      key,
      body.value as Prisma.InputJsonValue,
      body.description,
    );
  }

  /**
   * Delete system setting (ADMIN only)
   */
  @Delete('system/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete system setting',
    description: 'Delete system setting (admin only)',
  })
  @ApiParam({
    name: 'key',
    description: 'Setting key',
    example: 'custom_setting',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (admin role required)',
    type: ErrorResponseDto,
  })
  async deleteSystemSetting(@Param('key') key: string): Promise<void> {
    return this.settingsService.deleteSystemSetting(key);
  }
}
