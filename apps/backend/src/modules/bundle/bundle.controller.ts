import {
  Controller,
  Get,
  Post,
  Put,
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
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { BundleService } from './bundle.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { BundleQueryDto } from './dto/bundle-query.dto';
import {
  BundleResponseDto,
  BundleListResponseDto,
  BundleStatsDto,
} from './dto/bundle-response.dto';
import { AddUrlToBundleDto, AddMultipleUrlsDto } from './dto/add-url-to-bundle.dto';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('Bundles')
@Controller('api/bundles')
@UseGuards(JwtOrApiKeyAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiSecurity('API-Key')
export class BundleController {
  constructor(private readonly bundleService: BundleService) {}

  /**
   * Create bundle
   */
  @Post()
  @ApiOperation({
    summary: 'Create link bundle',
    description: `Create a new link bundle to organize multiple short URLs.

**Features:**
- Group multiple URLs into a collection
- Customize name, description, color, and icon
- Optionally add URLs during creation

**Authentication:**
- Supports JWT Token or API Key authentication`,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bundle created successfully',
    type: BundleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async create(
    @CurrentUser() user: any,
    @Body() createBundleDto: CreateBundleDto,
  ): Promise<BundleResponseDto> {
    return this.bundleService.create(user.id, createBundleDto);
  }

  /**
   * Get all bundles
   */
  @Get()
  @ApiOperation({
    summary: 'Get all bundles',
    description: `Get paginated list of all bundles for the authenticated user.

**Features:**
- Pagination support
- Filter by status (ACTIVE/ARCHIVED)
- Search by name or description
- Includes URL count and total clicks`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bundles retrieved successfully',
    type: BundleListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findAll(
    @CurrentUser() user: any,
    @Query() query: BundleQueryDto,
  ): Promise<BundleListResponseDto> {
    return this.bundleService.findAll(user.id, query, user.role);
  }

  /**
   * Get bundle by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get bundle by ID',
    description: 'Get detailed information about a specific bundle, including all URLs in the bundle',
  })
  @ApiParam({ name: 'id', description: 'Bundle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bundle retrieved successfully',
    type: BundleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bundle not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<BundleResponseDto> {
    return this.bundleService.findOne(user.id, id, user.role);
  }

  /**
   * Update bundle
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update bundle',
    description: 'Update bundle information (name, description, color, icon, status)',
  })
  @ApiParam({ name: 'id', description: 'Bundle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bundle updated successfully',
    type: BundleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bundle not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateBundleDto: UpdateBundleDto,
  ): Promise<BundleResponseDto> {
    return this.bundleService.update(user.id, id, updateBundleDto, user.role);
  }

  /**
   * Delete bundle
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete bundle',
    description: 'Delete a bundle (URLs in the bundle will NOT be deleted)',
  })
  @ApiParam({ name: 'id', description: 'Bundle ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Bundle deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bundle not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<void> {
    return this.bundleService.remove(user.id, id, user.role);
  }

  /**
   * Add URL to bundle
   */
  @Post(':id/urls')
  @ApiOperation({
    summary: 'Add URL to bundle',
    description: 'Add a single URL to a bundle',
  })
  @ApiParam({ name: 'id', description: 'Bundle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'URL added to bundle successfully',
    type: BundleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bundle or URL not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'URL already in bundle',
    type: ErrorResponseDto,
  })
  async addUrl(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() addUrlDto: AddUrlToBundleDto,
  ): Promise<BundleResponseDto> {
    return this.bundleService.addUrl(user.id, id, addUrlDto);
  }

  /**
   * Add multiple URLs to bundle
   */
  @Post(':id/urls/batch')
  @ApiOperation({
    summary: 'Add multiple URLs to bundle',
    description: 'Add multiple URLs to a bundle in a single request',
  })
  @ApiParam({ name: 'id', description: 'Bundle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'URLs added to bundle successfully',
    type: BundleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bundle not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Some URLs do not exist or already in bundle',
    type: ErrorResponseDto,
  })
  async addMultipleUrls(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() addUrlsDto: AddMultipleUrlsDto,
  ): Promise<BundleResponseDto> {
    return this.bundleService.addMultipleUrls(user.id, id, addUrlsDto);
  }

  /**
   * Remove URL from bundle
   */
  @Delete(':id/urls/:urlId')
  @ApiOperation({
    summary: 'Remove URL from bundle',
    description: 'Remove a URL from a bundle (the URL itself will NOT be deleted)',
  })
  @ApiParam({ name: 'id', description: 'Bundle ID' })
  @ApiParam({ name: 'urlId', description: 'URL ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'URL removed from bundle successfully',
    type: BundleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bundle or URL not found',
    type: ErrorResponseDto,
  })
  async removeUrl(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('urlId') urlId: string,
  ): Promise<BundleResponseDto> {
    return this.bundleService.removeUrl(user.id, id, urlId);
  }

  /**
   * Update URL order
   */
  @Patch(':id/urls/:urlId/order')
  @ApiOperation({
    summary: 'Update URL order in bundle',
    description: 'Update the display order of a URL within a bundle',
  })
  @ApiParam({ name: 'id', description: 'Bundle ID' })
  @ApiParam({ name: 'urlId', description: 'URL ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'URL order updated successfully',
    type: BundleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bundle or URL not found',
    type: ErrorResponseDto,
  })
  async updateUrlOrder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('urlId') urlId: string,
    @Body('order') order: number,
  ): Promise<BundleResponseDto> {
    return this.bundleService.updateUrlOrder(user.id, id, urlId, order);
  }

  /**
   * Get bundle statistics
   */
  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get bundle statistics',
    description: `Get detailed statistics for a bundle including:
- Total clicks across all URLs
- URL count
- Top performing URL
- Click trend (last 7 days)`,
  })
  @ApiParam({ name: 'id', description: 'Bundle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: BundleStatsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bundle not found',
    type: ErrorResponseDto,
  })
  async getStats(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<BundleStatsDto> {
    return this.bundleService.getStats(user.id, id);
  }

  /**
   * Archive bundle
   */
  @Post(':id/archive')
  @ApiOperation({
    summary: 'Archive bundle',
    description: 'Archive a bundle (change status to ARCHIVED)',
  })
  @ApiParam({ name: 'id', description: 'Bundle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bundle archived successfully',
    type: BundleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bundle not found',
    type: ErrorResponseDto,
  })
  async archive(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<BundleResponseDto> {
    return this.bundleService.archive(user.id, id);
  }

  /**
   * Restore bundle
   */
  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restore archived bundle',
    description: 'Restore an archived bundle (change status to ACTIVE)',
  })
  @ApiParam({ name: 'id', description: 'Bundle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bundle restored successfully',
    type: BundleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bundle not found',
    type: ErrorResponseDto,
  })
  async restore(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<BundleResponseDto> {
    return this.bundleService.restore(user.id, id);
  }
}
