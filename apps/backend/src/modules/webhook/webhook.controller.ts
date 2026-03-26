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
import { WebhookService } from './webhook.service';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  WebhookListResponseDto,
  WebhookLogsListResponseDto,
  WebhookTestResponseDto,
  WebhookLogResponseDto,
} from './dto/webhook.dto';
import { WebhookQueryDto, WebhookLogsQueryDto } from './dto/webhook-query.dto';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  RequestMeta,
  RequestMeta as RequestMetaType,
} from '@/common/decorators/request-meta.decorator';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('Webhooks')
@Controller('api/webhooks')
@UseGuards(JwtOrApiKeyAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiSecurity('API-Key')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Create a new webhook
   */
  @Post()
  @ApiOperation({
    summary: 'Create webhook',
    description: 'Create a new webhook subscription for events.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Webhook created successfully',
    type: WebhookResponseDto,
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
  async create(
    @CurrentUser() user: User,
    @Body() createWebhookDto: CreateWebhookDto,
    @RequestMeta() meta: RequestMetaType
  ): Promise<WebhookResponseDto> {
    return this.webhookService.create(user.id, createWebhookDto, meta);
  }

  /**
   * Get all webhooks with pagination
   */
  @Get()
  @ApiOperation({
    summary: 'Get all webhooks',
    description:
      'Get all webhook subscriptions for the current user with pagination support.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhooks retrieved successfully',
    type: WebhookListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findAll(
    @CurrentUser() user: User,
    @Query() query: WebhookQueryDto
  ): Promise<WebhookListResponseDto> {
    return this.webhookService.findAll(user.id, query, user.role);
  }

  /**
   * Get a single webhook
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get webhook details',
    description: 'Get details of a specific webhook.',
  })
  @ApiParam({
    name: 'id',
    description: 'Webhook ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook retrieved successfully',
    type: WebhookResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Webhook not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findOne(
    @CurrentUser() user: User,
    @Param('id') id: string
  ): Promise<WebhookResponseDto> {
    return this.webhookService.findOne(id, user.id, user.role);
  }

  /**
   * Update a webhook
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update webhook',
    description: 'Update webhook configuration.',
  })
  @ApiParam({
    name: 'id',
    description: 'Webhook ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook updated successfully',
    type: WebhookResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Webhook not found',
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
    @Body() updateWebhookDto: UpdateWebhookDto,
    @RequestMeta() meta: RequestMetaType
  ): Promise<WebhookResponseDto> {
    return this.webhookService.update(
      id,
      user.id,
      updateWebhookDto,
      user.role,
      meta
    );
  }

  /**
   * Delete a webhook
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete webhook',
    description: 'Delete a webhook subscription.',
  })
  @ApiParam({
    name: 'id',
    description: 'Webhook ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Webhook deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Webhook not found',
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
    @RequestMeta() meta: RequestMetaType
  ): Promise<void> {
    return this.webhookService.delete(id, user.id, user.role, meta);
  }

  /**
   * Get webhook delivery logs with pagination
   */
  @Get(':id/logs')
  @ApiOperation({
    summary: 'Get webhook logs',
    description:
      'Get delivery logs for a specific webhook with pagination support.',
  })
  @ApiParam({
    name: 'id',
    description: 'Webhook ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logs retrieved successfully',
    type: WebhookLogsListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Webhook not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getLogs(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query() query: WebhookLogsQueryDto
  ): Promise<WebhookLogsListResponseDto> {
    return this.webhookService.getLogs(id, user.id, query, user.role);
  }

  /**
   * Test webhook delivery
   */
  @Post(':id/test')
  @ApiOperation({
    summary: 'Test webhook',
    description: 'Send a test delivery to verify webhook configuration.',
  })
  @ApiParam({
    name: 'id',
    description: 'Webhook ID',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test delivery sent',
    type: WebhookTestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Webhook not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async test(
    @CurrentUser() user: User,
    @Param('id') id: string
  ): Promise<WebhookTestResponseDto> {
    return this.webhookService.test(id, user.id, user.role);
  }

  /**
   * Retry a failed webhook delivery
   */
  @Post(':webhookId/logs/:logId/retry')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Retry webhook delivery',
    description:
      'Retry a failed webhook delivery using the original payload and current webhook configuration.',
  })
  @ApiParam({
    name: 'webhookId',
    description: 'Webhook ID',
    example: 'clxxx123456789',
  })
  @ApiParam({
    name: 'logId',
    description: 'Webhook log ID',
    example: 'clxxx987654321',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retry delivery completed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Webhook or log not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot retry a successful delivery',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async retryLog(
    @CurrentUser() user: User,
    @Param('webhookId') webhookId: string,
    @Param('logId') logId: string,
    @RequestMeta() meta: RequestMetaType
  ): Promise<WebhookLogResponseDto> {
    return this.webhookService.retryLog(
      webhookId,
      logId,
      user.id,
      user.role,
      meta
    );
  }
}
