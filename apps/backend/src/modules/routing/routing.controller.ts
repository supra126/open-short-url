import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
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
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequestMeta, RequestMeta as RequestMetaType } from '@/common/decorators/request-meta.decorator';
import { RoutingService } from './routing.service';
import {
  CreateRoutingRuleDto,
  UpdateRoutingRuleDto,
  RoutingRuleResponseDto,
  RoutingRulesListResponseDto,
  RoutingRuleStatDto,
  UpdateSmartRoutingSettingsDto,
  SmartRoutingSettingsResponseDto,
  CreateFromTemplateDto,
  RoutingTemplateDto,
  TemplateListResponseDto,
} from './dto/routing-rule.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

interface AuthUser {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

@ApiTags('Routing Rules')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('API-Key')
@UseGuards(JwtOrApiKeyAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute for routing management
@Controller('api/urls/:urlId/routing-rules')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new routing rule',
    description: `Create a new smart routing rule for the specified URL.

**Routing Conditions:**
- Geographic: country, region, city
- Device: device type, OS, browser
- User: language preferences
- Traffic: referer source
- Time: time of day, day of week
- UTM: utm_source, utm_medium, utm_campaign, etc.

**Condition Operators:**
- equals, not_equals, contains, not_contains
- in, not_in (for arrays)
- starts_with, ends_with
- between, before, after (for time)

**Example:**
Redirect iOS users to App Store:
\`\`\`json
{
  "name": "iOS App Store",
  "targetUrl": "https://apps.apple.com/app/myapp",
  "priority": 100,
  "conditions": {
    "operator": "AND",
    "conditions": [
      { "type": "os", "operator": "equals", "value": "iOS" }
    ]
  }
}
\`\`\``,
  })
  @ApiParam({ name: 'urlId', description: 'URL ID', example: 'clxxx123456789' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Routing rule created successfully',
    type: RoutingRuleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters (e.g., invalid condition type or operator)',
    type: ErrorResponseDto,
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
  async create(
    @Param('urlId') urlId: string,
    @Body() dto: CreateRoutingRuleDto,
    @CurrentUser() user: AuthUser,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<RoutingRuleResponseDto> {
    return this.routingService.create(urlId, user.userId, dto, user.role, meta);
  }

  @Post('from-template')
  @ApiOperation({
    summary: 'Create a routing rule from template',
    description: `Create a routing rule using a predefined template.

**Available Templates:**
- \`APP_DOWNLOAD_IOS\`: Redirect iOS users to App Store
- \`APP_DOWNLOAD_ANDROID\`: Redirect Android users to Google Play
- \`MULTILANG_TW\`: Redirect Traditional Chinese users
- \`MULTILANG_CN\`: Redirect Simplified Chinese users
- \`BUSINESS_HOURS\`: Redirect during business hours (9:00-18:00, Mon-Fri)
- \`MOBILE_ONLY\`: Redirect mobile device users
- \`DESKTOP_ONLY\`: Redirect desktop users

Use GET /api/routing-templates to see all available templates.`,
  })
  @ApiParam({ name: 'urlId', description: 'URL ID', example: 'clxxx123456789' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Routing rule created from template successfully',
    type: RoutingRuleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid template key or request parameters',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL or template not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async createFromTemplate(
    @Param('urlId') urlId: string,
    @Body() dto: CreateFromTemplateDto,
    @CurrentUser() user: AuthUser,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<RoutingRuleResponseDto> {
    return this.routingService.createFromTemplate(urlId, user.userId, dto, user.role, meta);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all routing rules for a URL',
    description: 'Retrieve all routing rules for the specified URL with match statistics. Rules are sorted by priority (highest first).',
  })
  @ApiParam({ name: 'urlId', description: 'URL ID', example: 'clxxx123456789' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Routing rules retrieved successfully',
    type: RoutingRulesListResponseDto,
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
  async findAll(
    @Param('urlId') urlId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<RoutingRulesListResponseDto> {
    return this.routingService.findAll(urlId, user.userId, user.role);
  }

  @Get(':ruleId')
  @ApiOperation({
    summary: 'Get a single routing rule',
    description: 'Retrieve detailed information about a specific routing rule.',
  })
  @ApiParam({ name: 'urlId', description: 'URL ID', example: 'clxxx123456789' })
  @ApiParam({ name: 'ruleId', description: 'Routing Rule ID', example: 'clyyy987654321' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Routing rule retrieved successfully',
    type: RoutingRuleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL or routing rule not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async findOne(
    @Param('urlId') urlId: string,
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<RoutingRuleResponseDto> {
    return this.routingService.findOne(urlId, ruleId, user.userId, user.role);
  }

  @Put(':ruleId')
  @ApiOperation({
    summary: 'Update a routing rule',
    description: 'Update an existing routing rule. All fields are optional - only provided fields will be updated.',
  })
  @ApiParam({ name: 'urlId', description: 'URL ID', example: 'clxxx123456789' })
  @ApiParam({ name: 'ruleId', description: 'Routing Rule ID', example: 'clyyy987654321' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Routing rule updated successfully',
    type: RoutingRuleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL or routing rule not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async update(
    @Param('urlId') urlId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateRoutingRuleDto,
    @CurrentUser() user: AuthUser,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<RoutingRuleResponseDto> {
    return this.routingService.update(urlId, ruleId, user.userId, dto, user.role, meta);
  }

  @Delete(':ruleId')
  @ApiOperation({
    summary: 'Delete a routing rule',
    description: 'Delete a routing rule permanently. If this is the last rule and smart routing is enabled, consider disabling smart routing first.',
  })
  @ApiParam({ name: 'urlId', description: 'URL ID', example: 'clxxx123456789' })
  @ApiParam({ name: 'ruleId', description: 'Routing Rule ID', example: 'clyyy987654321' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Routing rule deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'URL or routing rule not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async delete(
    @Param('urlId') urlId: string,
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: AuthUser,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<void> {
    return this.routingService.delete(urlId, ruleId, user.userId, user.role, meta);
  }

  @Patch('settings')
  @ApiOperation({
    summary: 'Update smart routing settings',
    description: `Update smart routing settings for a URL.

**Settings:**
- \`isSmartRouting\`: Enable or disable smart routing for this URL
- \`defaultUrl\`: Fallback URL when no routing rules match (optional)

**Note:** When smart routing is enabled and no rules match, visitors will be redirected to:
1. The defaultUrl if set
2. Otherwise, the URL's original target URL`,
  })
  @ApiParam({ name: 'urlId', description: 'URL ID', example: 'clxxx123456789' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Smart routing settings updated successfully',
    type: SmartRoutingSettingsResponseDto,
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
  async updateSettings(
    @Param('urlId') urlId: string,
    @Body() dto: UpdateSmartRoutingSettingsDto,
    @CurrentUser() user: AuthUser,
    @RequestMeta() meta: RequestMetaType,
  ): Promise<SmartRoutingSettingsResponseDto> {
    return this.routingService.updateSettings(urlId, user.userId, dto, user.role, meta);
  }
}

/**
 * Controller for routing templates (not URL-specific)
 */
@ApiTags('Routing Templates')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('API-Key')
@UseGuards(JwtOrApiKeyAuthGuard)
@Controller('api/routing-templates')
export class RoutingTemplatesController {
  constructor(private readonly routingService: RoutingService) {}

  @Get()
  @ApiOperation({
    summary: 'Get available routing rule templates',
    description: `Get all predefined routing rule templates.

Templates provide pre-configured conditions for common routing scenarios:
- **App Downloads**: Redirect users to App Store or Google Play based on OS
- **Multi-Language**: Redirect users based on language/country preferences
- **Device Targeting**: Redirect mobile or desktop users separately
- **Business Hours**: Redirect based on time of day and day of week

Use POST /api/urls/{urlId}/routing-rules/from-template to create a rule from a template.`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Templates retrieved successfully',
    type: TemplateListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  getTemplates(): TemplateListResponseDto {
    return this.routingService.getTemplates();
  }
}
