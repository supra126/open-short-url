// Open Short URL Backend - Main Entry Point
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AuthExceptionFilter } from './common/filters/auth-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { HttpLoggerMiddleware } from './common/logger/http-logger.middleware';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);

  // Cookie parser
  const fastifyCookie = require('@fastify/cookie');
  await app.register(fastifyCookie);

  // Static files (before helmet to allow SVG favicon)
  const fastifyStatic = require('@fastify/static');
  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/static/',
    decorateReply: false,
  });

  // Security Headers (Helmet)
  const helmet = require('@fastify/helmet');
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

  // HTTP Logger middleware
  app.use(new HttpLoggerMiddleware(loggerService).use.bind(new HttpLoggerMiddleware(loggerService)));

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
1. Use \`POST /api/auth/login\` or \`POST /api/auth/register\` to obtain an access_token
2. Add to subsequent request headers: \`Authorization: Bearer <access_token>\`
3. JWT Token is used for general user operations

### API Key Authentication
1. Use \`POST /api/api-keys\` to create an API Key
2. Add to request headers: \`X-API-Key: <your-api-key>\`
3. API Key is suitable for server-to-server integration

## 🚀 Quick Start

### 1. Register Account
\`\`\`bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
\`\`\`

### 2. Create Short URL
\`\`\`bash
POST /api/urls
Authorization: Bearer <token>
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
- 🔑 API Key management
- 🎨 Brand customization (white-label)
- 🏷️ UTM parameter tracking

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
          'Enter JWT token obtained from /api/auth/login or /api/auth/register',
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
    .addTag('Authentication', 'User registration, login and authentication APIs')
    .addTag('URLs', 'URL shortening, query, update and delete APIs')
    .addTag('Redirect', 'Short URL redirect service and password verification')
    .addTag('Analytics', 'URL click analytics and statistics')
    .addTag('Settings', 'Brand settings and system configuration management')
    .addTag('API Keys', 'API Key creation, query and management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
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
