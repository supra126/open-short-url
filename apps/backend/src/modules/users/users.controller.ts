import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators';
import { RequestMeta, RequestMeta as RequestMetaType } from '@/common/decorators/request-meta.decorator';
import { User, UserRole } from '@prisma/client';
import { SuccessResponseDto } from '@/common/dto/success-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
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

@ApiTags('User Management')
@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create new user',
    description: 'Create a new user account. Admin access only.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin privileges',
    type: ErrorResponseDto,
  })
  async createUser(
    @CurrentUser() currentUser: User,
    @Body() createUserDto: CreateUserDto,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<UserResponseDto> {
    return this.usersService.createUser(createUserDto, currentUser.id, meta);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a paginated list of all users with optional filtering and search. Admin access only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user list',
    type: UserListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin privileges',
    type: ErrorResponseDto,
  })
  async getUsers(@Query() query: UserListQueryDto): Promise<UserListResponseDto> {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user details',
    description: 'Retrieve detailed information about a specific user. Admin access only.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'clu1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user details',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin privileges',
    type: ErrorResponseDto,
  })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.getUserById(id);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user role',
    description: 'Update the role of a specific user. Cannot modify your own role. Admin access only.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'clu1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated user role',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot modify your own role',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin privileges',
    type: ErrorResponseDto,
  })
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @CurrentUser() currentUser: User,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserRole(id, updateRoleDto, currentUser.id, meta);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user account status',
    description: 'Activate or deactivate a user account. Cannot deactivate your own account. Admin access only.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'clu1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated user account status',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot deactivate your own account',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin privileges',
    type: ErrorResponseDto,
  })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
    @CurrentUser() currentUser: User,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserStatus(id, updateStatusDto, currentUser.id, meta);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete a user and all their related data (URLs, clicks, API keys). Cannot delete your own account. Admin access only.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'clu1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted user',
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete your own account',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin privileges',
    type: ErrorResponseDto,
  })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<SuccessResponseDto> {
    await this.usersService.deleteUser(id, currentUser.id, meta);
    return {
      message: 'User deleted successfully',
      statusCode: 200,
    };
  }

  @Patch(':id/reset-password')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset user password',
    description: 'Reset the password for a specific user. Admin access only.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'clu1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully reset user password',
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires admin privileges',
    type: ErrorResponseDto,
  })
  async resetUserPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @CurrentUser() currentUser: User,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<SuccessResponseDto> {
    await this.usersService.resetUserPassword(id, resetPasswordDto, currentUser.id, meta);
    return {
      message: 'Password reset successfully',
      statusCode: 200,
    };
  }

  @Patch(':id/name')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user name',
    description: 'Update the display name of a specific user. Admin access only.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Name updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found', type: ErrorResponseDto })
  async updateUserName(
    @Param('id') id: string,
    @Body() updateNameDto: UpdateUserNameDto,
    @CurrentUser() currentUser: User,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserName(id, updateNameDto, currentUser.id, meta);
  }

  @Patch(':id/2fa')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin disable 2FA',
    description: 'Force-disable two-factor authentication for a user. Admin access only.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: '2FA is not enabled for this user', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found', type: ErrorResponseDto })
  async adminDisable2FA(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<UserResponseDto> {
    return this.usersService.adminDisable2FA(id, currentUser.id, meta);
  }

  @Get(':id/oidc-accounts')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user OIDC accounts',
    description: 'Retrieve all SSO accounts linked to a specific user. Admin access only.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved OIDC accounts', type: [OidcAccountResponseDto] })
  @ApiResponse({ status: 404, description: 'User not found', type: ErrorResponseDto })
  async getUserOidcAccounts(@Param('id') id: string): Promise<OidcAccountResponseDto[]> {
    return this.usersService.getUserOidcAccounts(id);
  }

  @Delete(':id/oidc-accounts/:accountId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unlink user OIDC account',
    description: 'Remove a specific SSO account link from a user. Admin access only.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiParam({ name: 'accountId', description: 'OIDC Account ID' })
  @ApiResponse({ status: 200, description: 'OIDC account unlinked successfully', type: SuccessResponseDto })
  @ApiResponse({ status: 404, description: 'OIDC account link not found', type: ErrorResponseDto })
  async deleteUserOidcAccount(
    @Param('id') id: string,
    @Param('accountId') accountId: string,
    @CurrentUser() currentUser: User,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<SuccessResponseDto> {
    await this.usersService.deleteUserOidcAccount(id, accountId, currentUser.id, meta);
    return {
      message: 'OIDC account unlinked successfully',
      statusCode: 200,
    };
  }
}
