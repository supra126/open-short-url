// Open Short URL Backend - Main Entry Point
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { AuthExceptionFilter } from './common/filters/auth-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { HttpLoggerMiddleware } from './common/logger/http-logger.middleware';
import { writeFileSync } from 'fs';
import { join } from 'path';

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

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);

  // Cookie parser
  await app.register(fastifyCookie);

  // Static files (before helmet to allow SVG favicon)
  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/static/',
    decorateReply: false,
  });

  // Security Headers (Helmet)
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'https:'],
        scriptSrc: [
          `'self'`,
          `'unsafe-inline'`, // Allow inline scripts for password page
          'https://challenges.cloudflare.com', // Cloudflare Turnstile
          'https://static.cloudflareinsights.com', // Cloudflare Web Analytics
        ],
        frameSrc: [
          `'self'`,
          'https://challenges.cloudflare.com', // Cloudflare Turnstile iframe
        ],
        connectSrc: [
          `'self'`,
          'https://challenges.cloudflare.com', // Cloudflare Turnstile API
          'https://cloudflareinsights.com', // Cloudflare Web Analytics
        ],
        formAction: [`'self'`], // Allow form submissions to same origin
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding external resources
  });

  // No global prefix - controllers specify their own paths
  // This allows RedirectController to use root path while API controllers use /api

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global exception filters
  app.useGlobalFilters(new AuthExceptionFilter());

  // HTTP Logger - Register Fastify hooks for request/response logging
  const httpLogger = new HttpLoggerMiddleware(loggerService);
  const fastifyInstance = app.getHttpAdapter().getInstance();
  httpLogger.registerHooks(fastifyInstance);

  // CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
  });

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Open Short URL API')
    .setDescription(
      `# Open Short URL API Documentation

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
`
    )
    .setVersion('1.0.0')
    .setContact(
      'Open Short URL Team',
      'https://github.com/supra126/open-short-url',
      'supra126@gmail.com'
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
        description:
          'Enter JWT token obtained from /api/auth/login',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description:
          'Enter API Key created from /api/api-keys. Suitable for server-to-server integration.',
      },
      'API-Key'
    )
    .addTag('Authentication', 'User login, logout and authentication APIs')
    .addTag('URLs', 'URL shortening, query, update and delete APIs')
    .addTag('Redirect', 'Short URL redirect service and password verification')
    .addTag('Analytics', 'URL click analytics and statistics')
    .addTag('Settings', 'Brand settings and system configuration management')
    .addTag('API Keys', 'API Key creation, query and management')
    .addTag('Bundles', 'Link bundle management for organizing multiple short URLs')
    .addTag('Webhooks', 'Webhook subscription and event notification management')
    .addTag('User Management', 'User account management and administration (Admin only)')
    .addTag('Audit Logs', 'System audit logging and security tracking (Admin only)')
    .addTag('Routing Rules', 'Smart routing rules for A/B testing and conditional redirects')
    .addTag('Routing Templates', 'Pre-defined routing rule templates')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    extraModels: [
      // Query DTOs - exported to OpenAPI schemas for frontend type generation
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
      // Routing Enum DTOs - for OpenAPI enum export
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
    ],
  });
  SwaggerModule.setup('api', app, document);

  // Generate OpenAPI JSON for frontend (development only)
  if (process.env.NODE_ENV === 'development') {
    try {
      const outputPath = join(
        __dirname,
        '../../frontend/src/lib/api/openapi.json'
      );
      writeFileSync(outputPath, JSON.stringify(document, null, 2));
      loggerService.log(`✅ OpenAPI spec generated: ${outputPath}`, 'Bootstrap');
    } catch (error) {
      loggerService.warn(`⚠️  Could not generate OpenAPI spec for frontend: ${error}`, 'Bootstrap');
    }
  }

  const port = configService.get<number>('PORT', 4101);
  const host = configService.get<string>('HOST', '0.0.0.0');
  await app.listen(port, host);

  loggerService.log(
    `🚀 Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
  loggerService.log(
    `📚 Swagger documentation: http://localhost:${port}/api`,
    'Bootstrap',
  );
}

bootstrap();
