import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  IsBoolean,
  IsArray,
  IsOptional,
  IsObject,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { PaginationMetaDto } from '@/common/dto/paginated-response.dto';

/**
 * Create Webhook DTO
 */
export class CreateWebhookDto {
  @ApiProperty({
    description: 'Webhook name',
    example: 'Slack Notification',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Target URL for webhook delivery',
    example: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
  })
  @IsUrl()
  url!: string;

  @ApiProperty({
    description: 'Secret key for signature verification',
    example: 'your-secret-key-here',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  secret!: string;

  @ApiProperty({
    description: 'Event types to subscribe to',
    example: ['url.created', 'url.clicked'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events!: string[];

  @ApiProperty({
    description: 'Custom HTTP headers (optional)',
    example: { Authorization: 'Bearer token' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiProperty({
    description: 'Whether this webhook is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Update Webhook DTO
 */
export class UpdateWebhookDto extends PartialType(CreateWebhookDto) {}

/**
 * Webhook Response DTO
 */
export class WebhookResponseDto {
  @ApiProperty({ description: 'Webhook ID', example: 'clx1234567890' })
  id!: string;

  @ApiProperty({ description: 'User ID who owns this webhook' })
  userId!: string;

  @ApiProperty({ description: 'Webhook name', example: 'Slack Notification' })
  name!: string;

  @ApiProperty({
    description: 'Target URL',
    example: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
  })
  url!: string;

  @ApiProperty({ description: 'Whether this webhook is active' })
  isActive!: boolean;

  @ApiProperty({
    description: 'Subscribed event types',
    example: ['url.created', 'url.clicked'],
  })
  events!: string[];

  @ApiProperty({
    description: 'Custom headers',
    example: { Authorization: 'Bearer token' },
    required: false,
  })
  headers?: Record<string, string>;

  @ApiProperty({ description: 'Total number of deliveries sent' })
  totalSent!: number;

  @ApiProperty({ description: 'Total number of successful deliveries' })
  totalSuccess!: number;

  @ApiProperty({ description: 'Total number of failed deliveries' })
  totalFailed!: number;

  @ApiProperty({
    description: 'Last delivery timestamp',
    required: false,
  })
  lastSentAt?: Date;

  @ApiProperty({
    description: 'Last error message',
    required: false,
  })
  lastError?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

/**
 * Webhook List Response DTO
 */
export class WebhookListResponseDto extends PaginationMetaDto {
  @ApiProperty({
    description: 'List of webhooks',
    type: [WebhookResponseDto],
  })
  data!: WebhookResponseDto[];
}

/**
 * Webhook Log Response DTO
 */
export class WebhookLogResponseDto {
  @ApiProperty({ description: 'Log ID', example: 'clx9876543210' })
  id!: string;

  @ApiProperty({ description: 'Webhook ID' })
  webhookId!: string;

  @ApiProperty({
    description: 'Event type',
    example: 'url.created',
  })
  event!: string;

  @ApiProperty({
    description: 'Payload sent',
    example: { urlId: 'clx123', slug: 'abc123' },
  })
  payload!: Record<string, unknown>;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
    required: false,
  })
  statusCode?: number;

  @ApiProperty({
    description: 'Response from webhook endpoint (truncated to 1000 chars)',
    required: false,
  })
  response?: string;

  @ApiProperty({
    description: 'Error message if delivery failed',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'Request duration in milliseconds',
    example: 123,
    required: false,
  })
  duration?: number;

  @ApiProperty({
    description: 'Attempt number (for retries)',
    example: 1,
  })
  attempt!: number;

  @ApiProperty({
    description: 'Whether delivery was successful',
  })
  isSuccess!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;
}

/**
 * Webhook Logs List Response DTO
 */
export class WebhookLogsListResponseDto extends PaginationMetaDto {
  @ApiProperty({
    description: 'List of webhook logs',
    type: [WebhookLogResponseDto],
  })
  data!: WebhookLogResponseDto[];
}

/**
 * Webhook Test Response DTO
 */
export class WebhookTestResponseDto {
  @ApiProperty({ description: 'Whether test delivery was successful' })
  success!: boolean;

  @ApiProperty({ description: 'HTTP status code', required: false })
  statusCode?: number;

  @ApiProperty({ description: 'Response from webhook endpoint', required: false })
  response?: string;

  @ApiProperty({ description: 'Error message if test failed', required: false })
  error?: string;

  @ApiProperty({ description: 'Request duration in milliseconds' })
  duration!: number;
}
