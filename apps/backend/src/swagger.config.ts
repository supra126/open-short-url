import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { LoggerService } from './common/logger/logger.service';

// Import Query DTOs for OpenAPI schema export
import { AnalyticsQueryDto } from './modules/analytics/dto/analytics-query.dto';
import { ExportQueryDto, ExportFormatDto } from './modules/analytics/dto/export-query.dto';
import { UrlQueryDto } from './modules/url/dto/url-query.dto';
import {
  UrlStatusDto,
  DashboardStatsResponseDto,
  TopPerformingUrlDto,
} from './modules/url/dto/url-response.dto';
import { BundleQueryDto } from './modules/bundle/dto/bundle-query.dto';
import { UserListQueryDto } from './modules/users/dto/user-list-query.dto';
import { AuditLogQueryDto } from './modules/audit-log/dto/audit-log-query.dto';
import { PaginationDto } from './common/dto';

// Import Routing DTOs for OpenAPI schema export
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
} from './modules/routing/dto/routing-rule.dto';
import {
  TimeRangeDto,
  ConditionItemDto,
  RoutingConditionsDto,
} from './modules/routing/dto/routing-condition.dto';
import {
  ConditionTypeDto,
  ConditionOperatorDto,
  LogicalOperatorDto,
  DeviceTypeDto,
  DayOfWeekDto,
} from './modules/routing/dto/routing-enums.dto';

// Import Bulk Operation DTOs for OpenAPI schema export
import {
  BulkCreateUrlDto,
  BulkCreateSuccessItem,
  BulkCreateFailureItem,
  BulkCreateResultDto,
} from './modules/url/dto/bulk-create-url.dto';
import {
  BulkUpdateStatusDto,
  BulkAddToBundleDto,
  BulkUpdateExpirationDto,
  BulkUpdateUtmDto,
  BulkUpdateUrlDto,
  BulkUpdateResultDto,
} from './modules/url/dto/bulk-update-url.dto';
import {
  BulkDeleteUrlDto,
  BulkDeleteResultDto,
} from './modules/url/dto/bulk-delete-url.dto';

// Import Analytics Response DTOs for OpenAPI schema export
import {
  RoutingRuleStat,
  RoutingRuleTimeSeriesDataPoint,
  RoutingRuleGeoStat,
  RoutingRuleDeviceStat,
  RoutingAnalyticsResponseDto,
} from './modules/analytics/dto/analytics-response.dto';

const SWAGGER_DESCRIPTION = `# Open Short URL API Documentation

## 📖 Overview
Open Short URL is an open-source URL shortening platform providing complete URL shortening, management, and analytics features.

## 🔐 Authentication

### JWT Authentication
1. Use \`POST /api/auth/login\` to authenticate (token stored in httpOnly cookie)
2. The JWT token is automatically sent via cookie for subsequent requests
3. JWT Token is used for general user operations

### API Key Authentication
1. Use \`POST /api/api-keys\` to create an API Key
2. Add to request headers: \`X-API-Key: <your-api-key>\`
3. API Key is suitable for server-to-server integration

## 🚀 Quick Start

### 1. Login
\`\`\`bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

### 2. Create Short URL
\`\`\`bash
POST /api/urls
{
  "originalUrl": "https://example.com/very-long-url",
  "customSlug": "my-link"
}
\`\`\`

### 3. Use Short URL
Visit \`GET /:slug\` to redirect to the original URL

## 📊 Features
- ✅ URL shortening with custom slugs
- 🔒 Password protection
- ⏰ Expiration time
- 📈 Click statistics and analytics
- 🌍 Geo-location tracking
- 🤖 Bot detection
- 🔑 API Key management
- 🎨 Brand customization (white-label)
- 🏷️ UTM parameter tracking
- 🔀 Smart routing & A/B testing
- 📦 Link bundles/collections
- 🔔 Webhook notifications
- 🔐 Two-factor authentication (2FA)
- 📋 Audit logging
- 📥 Bulk operations (CSV import)
- 👥 User management (Admin)

## 💡 Support
- Documentation: https://github.com/supra126/open-short-url
- Issue Tracker: https://github.com/supra126/open-short-url/issues
`;

const SWAGGER_TAGS: [string, string][] = [
  ['Authentication', 'User login, logout and authentication APIs'],
  ['URLs', 'URL shortening, query, update and delete APIs'],
  ['Redirect', 'Short URL redirect service and password verification'],
  ['Analytics', 'URL click analytics and statistics'],
  ['Settings', 'Brand settings and system configuration management'],
  ['API Keys', 'API Key creation, query and management'],
  ['Bundles', 'Link bundle management for organizing multiple short URLs'],
  ['Webhooks', 'Webhook subscription and event notification management'],
  ['User Management', 'User account management and administration (Admin only)'],
  ['Audit Logs', 'System audit logging and security tracking (Admin only)'],
  ['Routing Rules', 'Smart routing rules for A/B testing and conditional redirects'],
  ['Routing Templates', 'Pre-defined routing rule templates'],
];

const EXTRA_MODELS = [
  // Query DTOs
  PaginationDto,
  AnalyticsQueryDto,
  ExportQueryDto,
  UrlQueryDto,
  BundleQueryDto,
  UserListQueryDto,
  AuditLogQueryDto,
  // Routing DTOs
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
  TimeRangeDto,
  ConditionItemDto,
  RoutingConditionsDto,
  // Bulk Operation DTOs
  BulkCreateUrlDto,
  BulkCreateSuccessItem,
  BulkCreateFailureItem,
  BulkCreateResultDto,
  BulkUpdateStatusDto,
  BulkAddToBundleDto,
  BulkUpdateExpirationDto,
  BulkUpdateUtmDto,
  BulkUpdateUrlDto,
  BulkUpdateResultDto,
  BulkDeleteUrlDto,
  BulkDeleteResultDto,
  // Routing Analytics DTOs
  RoutingRuleStat,
  RoutingRuleTimeSeriesDataPoint,
  RoutingRuleGeoStat,
  RoutingRuleDeviceStat,
  RoutingAnalyticsResponseDto,
  // Routing Enum DTOs
  ConditionTypeDto,
  ConditionOperatorDto,
  LogicalOperatorDto,
  DeviceTypeDto,
  DayOfWeekDto,
  // URL Stats and Dashboard DTOs
  UrlStatusDto,
  DashboardStatsResponseDto,
  TopPerformingUrlDto,
  // Export Format Enum DTO
  ExportFormatDto,
];

/**
 * Setup Swagger documentation.
 * Returns true if Swagger was enabled, false otherwise.
 */
export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
  loggerService: LoggerService,
): boolean {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED', 'false') === 'true';

  if (isProduction && !swaggerEnabled) {
    loggerService.log(
      '📚 Swagger documentation is disabled in production. Set SWAGGER_ENABLED=true to enable.',
      'Bootstrap',
    );
    return false;
  }

  const builder = new DocumentBuilder()
    .setTitle('Open Short URL API')
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion('1.0.0')
    .setContact(
      'Open Short URL Team',
      'https://github.com/supra126/open-short-url',
      'supra126@gmail.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:4101', 'Local Development')
    .addServer('https://api.yourdomain.com', 'Production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token obtained from /api/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description:
          'Enter API Key created from /api/api-keys. Suitable for server-to-server integration.',
      },
      'API-Key',
    );

  for (const [name, description] of SWAGGER_TAGS) {
    builder.addTag(name, description);
  }

  const config = builder.build();
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: EXTRA_MODELS,
  });
  SwaggerModule.setup('api', app, document);

  // Generate OpenAPI JSON for frontend (development only)
  if (!isProduction) {
    try {
      const outputPath = join(
        __dirname,
        '../../frontend/src/lib/api/openapi.json',
      );
      writeFileSync(outputPath, JSON.stringify(document, null, 2));
      loggerService.log(`✅ OpenAPI spec generated: ${outputPath}`, 'Bootstrap');
    } catch (error) {
      loggerService.warn(
        `⚠️  Could not generate OpenAPI spec for frontend: ${error}`,
        'Bootstrap',
      );
    }
  }

  return true;
}
