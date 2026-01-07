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
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { UrlQueryDto } from './dto/url-query.dto';
import { UrlResponseDto, UrlListResponseDto } from './dto/url-response.dto';
import {
  CreateVariantDto,
  UpdateVariantDto,
  VariantResponseDto,
  VariantListResponseDto,
} from './dto/variant.dto';
import { BulkCreateUrlDto, BulkCreateResultDto } from './dto/bulk-create-url.dto';
import { BulkUpdateUrlDto, BulkUpdateResultDto } from './dto/bulk-update-url.dto';
import { BulkDeleteUrlDto, BulkDeleteResultDto } from './dto/bulk-delete-url.dto';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequestMeta, RequestMeta as RequestMetaType } from '@/common/decorators/request-meta.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

// Maximum items per bulk request to prevent resource exhaustion
const MAX_BULK_ITEMS = 500;
const MAX_BULK_ITEMS_USER = 100; // Lower limit for regular users

@ApiTags('URLs')
@Controller('api/urls')
@UseGuards(JwtOrApiKeyAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiSecurity('API-Key')
export class UrlController {
  constructor(
    private readonly urlService: UrlService,
  ) {}

  /**
   * Validate bulk operation item count based on user role
   */
  private validateBulkItemCount(itemCount: number, isAdmin: boolean): void {
    const maxItems = isAdmin ? MAX_BULK_ITEMS : MAX_BULK_ITEMS_USER;
    if (itemCount > maxItems) {
      throw new BadRequestException(
        `Maximum ${maxItems} items per request. You requested ${itemCount} items.`,
      );
    }
    if (itemCount === 0) {
      throw new BadRequestException('At least 1 item is required for bulk operations.');
    }
  }

  /**
   * Create short URL
   */
  @Post()
  @ApiOperation({
    summary: 'Create short URL',
    description: `Create a new short URL.

**Features:**
- Customize short URL code (customSlug), or let the system auto-generate
- Support password protection, expiration time, UTM parameters and other advanced features
- Custom code must be unique and cannot duplicate existing short URLs

**Authentication:**
- Supports JWT Token or API Key authentication`,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Short URL created successfully',
    type: UrlResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters (e.g., invalid URL format, code format does not meet requirements)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Custom code already in use',
    schema: {
      example: {
        message: 'Slug already exists',
        statusCode: 409,
        timestamp: '2025-10-17T09:08:52.000Z',
        path: '/api/urls',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized (missing or invalid JWT Token / API Key)',
    type: ErrorResponseDto,
  })
  async create(
    @CurrentUser() user: User,
    @Body() createUrlDto: CreateUrlDto,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<UrlResponseDto> {
    return this.urlService.create(user.id, createUrlDto, meta);
  }

  // ==================== Bulk Operations ====================

  /**
   * Bulk create short URLs
   */
  @Post('bulk')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Bulk create short URLs',
    description: `Bulk create short URLs (max 500 per request).

**Features:**
- Partial success strategy: successful URLs are created, failed ones return error details
- Supports all single URL creation parameters (customSlug, title, password, etc.)
- Perfect for CSV import scenarios

**Limits:**
- Maximum 500 URLs per request
- Duplicate customSlug will cause that specific URL to fail`,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk creation completed (includes success and failure details)',
    type: BulkCreateResultDto,
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
  async bulkCreate(
    @CurrentUser() user: User,
    @Body() bulkCreateDto: BulkCreateUrlDto,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<BulkCreateResultDto> {
    this.validateBulkItemCount(bulkCreateDto.urls.length, user.role === 'ADMIN');
    return this.urlService.bulkCreate(user.id, bulkCreateDto.urls, meta);
  }

  /**
   * Bulk update short URLs
   */
  @Patch('bulk')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Bulk update short URLs',
    description: `Bulk update short URLs with various operations.

**Supported operations:**
- \`status\`: Change status to ACTIVE or INACTIVE
- \`bundle\`: Add URLs to a bundle
- \`expiration\`: Set or remove expiration date
- \`utm\`: Update UTM parameters

**Limits:**
- Maximum 500 URLs per request
- Only URLs owned by the user (or all if ADMIN) will be updated`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk update completed',
    type: BulkUpdateResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No URLs found or no permission',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async bulkUpdate(
    @CurrentUser() user: User,
    @Body() bulkUpdateDto: BulkUpdateUrlDto,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<BulkUpdateResultDto> {
    this.validateBulkItemCount(bulkUpdateDto.urlIds.length, user.role === 'ADMIN');
    return this.urlService.bulkUpdate(
      user.id,
      bulkUpdateDto.urlIds,
      bulkUpdateDto.operation,
      user.role,
      meta,
    );
  }

  /**
   * Bulk delete short URLs
   */
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Bulk delete short URLs',
    description: `Bulk delete short URLs and their related click records.

**Limits:**
- Maximum 500 URLs per request
- Only URLs owned by the user (or all if ADMIN) will be deleted`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk deletion completed',
    type: BulkDeleteResultDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No URLs found or no permission',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async bulkDelete(
    @CurrentUser() user: User,
    @Body() bulkDeleteDto: BulkDeleteUrlDto,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<BulkDeleteResultDto> {
    this.validateBulkItemCount(bulkDeleteDto.urlIds.length, user.role === 'ADMIN');
    return this.urlService.bulkDelete(user.id, bulkDeleteDto.urlIds, user.role, meta);
  }

  /**
   * Query all short URLs (paginated)
   */
  @Get()
  @ApiOperation({
    summary: 'Query all short URLs',
    description: `Query all short URLs of the current user.

**Query Features:**
- Pagination: Control with page and pageSize parameters
- Search: Use search parameter to search title or original URL
- Filter: Use status parameter to filter by status
- Sort: Use sortBy and sortOrder parameters for custom sorting

**Example:**
\`GET /api/urls?page=1&pageSize=10&search=example&status=ACTIVE&sortBy=clickCount&sortOrder=desc\``,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful, returns paginated results',
    type: UrlListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized (missing or invalid JWT Token / API Key)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters (e.g., invalid page number or page size format)',
    type: ErrorResponseDto,
  })
  async findAll(
    @CurrentUser() user: User,
    @Query() queryDto: UrlQueryDto,
  ): Promise<UrlListResponseDto> {
    return this.urlService.findAll(user.id, queryDto, user.role);
  }

  /**
   * Generate QR Code for short URL
   */
  @Get(':id/qrcode')
  @ApiOperation({
    summary: 'Generate QR Code',
    description: 'Generate QR Code for the specified short URL (returns Base64 Data URL format)',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'QR Code generated successfully',
    schema: {
      type: 'object',
      properties: {
        qrCode: {
          type: 'string',
          description: 'Base64 encoded QR Code Data URL (can be directly used in img src)',
          example: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Short URL not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async generateQRCode(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('width') width?: number,
    @Query('color') color?: string,
  ): Promise<{ qrCode: string }> {
    const qrCode = await this.urlService.generateQRCode(
      id,
      user.id,
      {
        width: width ? Number(width) : undefined,
        color: color
          ? { dark: color }
          : undefined,
      },
      user.role,
    );

    return { qrCode };
  }

  /**
   * Query single short URL
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Query single short URL',
    description: 'Retrieve short URL details by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
    type: UrlResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Short URL not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<UrlResponseDto> {
    return this.urlService.findOne(id, user.id, user.role);
  }

  /**
   * Update short URL
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update short URL',
    description: 'Update short URL information, including original URL, title, status, password, etc.',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Updated successfully',
    type: UrlResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Short URL not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateUrlDto: UpdateUrlDto,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<UrlResponseDto> {
    return this.urlService.update(id, user.id, updateUrlDto, user.role, meta);
  }

  /**
   * Delete short URL
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete short URL',
    description: 'Delete the specified short URL and its related click records',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Short URL not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async delete(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<void> {
    return this.urlService.delete(id, user.id, user.role, meta);
  }

  // ==================== A/B Testing Variant Management ====================

  /**
   * Create a new variant for A/B testing
   */
  @Post(':id/variants')
  @ApiOperation({
    summary: 'Create A/B testing variant',
    description: 'Create a new variant for A/B testing. Automatically enables A/B testing mode for the URL.',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Variant created successfully',
    type: VariantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async createVariant(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() createVariantDto: CreateVariantDto,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<VariantResponseDto> {
    return this.urlService.createVariant(id, user.id, createVariantDto, user.role, meta);
  }

  /**
   * Get all variants for a URL
   */
  @Get(':id/variants')
  @ApiOperation({
    summary: 'Get all A/B testing variants',
    description: 'Get all variants for the specified URL with click statistics.',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variants retrieved successfully',
    type: VariantListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findAllVariants(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<VariantListResponseDto> {
    return this.urlService.findAllVariants(id, user.id, user.role);
  }

  /**
   * Get a single variant
   */
  @Get(':id/variants/:variantId')
  @ApiOperation({
    summary: 'Get a single variant',
    description: 'Get details of a specific variant.',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiParam({
    name: 'variantId',
    description: 'Variant ID',
    example: 'clyyy987654321',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variant retrieved successfully',
    type: VariantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL or variant not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findOneVariant(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ): Promise<VariantResponseDto> {
    return this.urlService.findOneVariant(id, variantId, user.id, user.role);
  }

  /**
   * Update a variant
   */
  @Put(':id/variants/:variantId')
  @ApiOperation({
    summary: 'Update a variant',
    description: 'Update variant information including name, target URL, weight, and active status.',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiParam({
    name: 'variantId',
    description: 'Variant ID',
    example: 'clyyy987654321',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variant updated successfully',
    type: VariantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL or variant not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async updateVariant(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() updateVariantDto: UpdateVariantDto,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<VariantResponseDto> {
    return this.urlService.updateVariant(id, variantId, user.id, updateVariantDto, user.role, meta);
  }

  /**
   * Delete a variant
   */
  @Delete(':id/variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a variant',
    description: 'Delete a variant. If this is the last variant, A/B testing mode will be disabled for the URL.',
  })
  @ApiParam({
    name: 'id',
    description: 'URL ID',
    example: 'clxxx123456789',
  })
  @ApiParam({
    name: 'variantId',
    description: 'Variant ID',
    example: 'clyyy987654321',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Variant deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL or variant not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async deleteVariant(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<void> {
    return this.urlService.deleteVariant(id, variantId, user.id, user.role, meta);
  }
}
