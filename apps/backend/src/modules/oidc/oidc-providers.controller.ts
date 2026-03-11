import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { OidcProviderService } from './oidc-provider.service';
import {
  CreateOidcProviderDto,
  UpdateOidcProviderDto,
  OidcProviderResponseDto,
} from './dto/oidc-provider.dto';

@ApiTags('OIDC Providers (Admin)')
@Controller('api/admin/oidc-providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class OidcProvidersController {
  constructor(private readonly oidcProviderService: OidcProviderService) {}

  @Get()
  @ApiOperation({ summary: 'List all OIDC providers' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved providers', type: [OidcProviderResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin privileges', type: ErrorResponseDto })
  async findAll(): Promise<OidcProviderResponseDto[]> {
    return this.oidcProviderService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create an OIDC provider' })
  @ApiResponse({ status: 201, description: 'Provider created successfully', type: OidcProviderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request parameters', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin privileges', type: ErrorResponseDto })
  async create(
    @Body() dto: CreateOidcProviderDto,
    @CurrentUser() user: User,
  ): Promise<OidcProviderResponseDto> {
    return this.oidcProviderService.create(dto, user.id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get an OIDC provider by slug' })
  @ApiParam({ name: 'slug', description: 'Provider slug' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved provider', type: OidcProviderResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin privileges', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Provider not found', type: ErrorResponseDto })
  async findOne(
    @Param('slug') slug: string,
  ): Promise<OidcProviderResponseDto> {
    return this.oidcProviderService.findBySlugAsDto(slug);
  }

  @Put(':slug')
  @ApiOperation({ summary: 'Update an OIDC provider' })
  @ApiParam({ name: 'slug', description: 'Provider slug' })
  @ApiResponse({ status: 200, description: 'Provider updated successfully', type: OidcProviderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request parameters', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin privileges', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Provider not found', type: ErrorResponseDto })
  async update(
    @Param('slug') slug: string,
    @Body() dto: UpdateOidcProviderDto,
    @CurrentUser() user: User,
  ): Promise<OidcProviderResponseDto> {
    return this.oidcProviderService.update(slug, dto, user.id);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an OIDC provider' })
  @ApiParam({ name: 'slug', description: 'Provider slug' })
  @ApiResponse({ status: 204, description: 'Provider deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin privileges', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Provider not found', type: ErrorResponseDto })
  async delete(
    @Param('slug') slug: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.oidcProviderService.delete(slug, user.id);
  }
}
