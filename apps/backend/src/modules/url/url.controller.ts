import {
  Controller,
  Get,
  Post,
  Put,
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
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('URLs')
@Controller('api/urls')
@UseGuards(JwtOrApiKeyAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UrlController {
  constructor(
    private readonly urlService: UrlService,
  ) {}

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
    @CurrentUser() user: any,
    @Body() createUrlDto: CreateUrlDto,
  ): Promise<UrlResponseDto> {
    return this.urlService.create(user.id, createUrlDto);
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
    @CurrentUser() user: any,
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
    @CurrentUser() user: any,
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
    @CurrentUser() user: any,
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateUrlDto: UpdateUrlDto,
  ): Promise<UrlResponseDto> {
    return this.urlService.update(id, user.id, updateUrlDto, user.role);
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
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<void> {
    return this.urlService.delete(id, user.id, user.role);
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() createVariantDto: CreateVariantDto,
  ): Promise<VariantResponseDto> {
    return this.urlService.createVariant(id, user.id, createVariantDto, user.role);
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
    @CurrentUser() user: any,
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
    @CurrentUser() user: any,
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() updateVariantDto: UpdateVariantDto,
  ): Promise<VariantResponseDto> {
    return this.urlService.updateVariant(id, variantId, user.id, updateVariantDto, user.role);
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ): Promise<void> {
    return this.urlService.deleteVariant(id, variantId, user.id, user.role);
  }
}
