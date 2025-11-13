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
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  WebhookListResponseDto,
  WebhookLogsListResponseDto,
  WebhookTestResponseDto,
} from './dto/webhook.dto';
import { WebhookQueryDto, WebhookLogsQueryDto } from './dto/webhook-query.dto';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
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
    @CurrentUser() user: any,
    @Body() createWebhookDto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhookService.create(user.id, createWebhookDto);
  }

  /**
   * Get all webhooks with pagination
   */
  @Get()
  @ApiOperation({
    summary: 'Get all webhooks',
    description: 'Get all webhook subscriptions for the current user with pagination support.',
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
    @CurrentUser() user: any,
    @Query() query: WebhookQueryDto,
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
    @CurrentUser() user: any,
    @Param('id') id: string,
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhookService.update(id, user.id, updateWebhookDto, user.role);
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
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<void> {
    return this.webhookService.delete(id, user.id, user.role);
  }

  /**
   * Get webhook delivery logs with pagination
   */
  @Get(':id/logs')
  @ApiOperation({
    summary: 'Get webhook logs',
    description: 'Get delivery logs for a specific webhook with pagination support.',
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
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query() query: WebhookLogsQueryDto,
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
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<WebhookTestResponseDto> {
    return this.webhookService.test(id, user.id, user.role);
  }
}
