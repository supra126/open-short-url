// Open Short URL Backend - Main Entry Point
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import helmet from '@fastify/helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { AuthExceptionFilter } from './common/filters/auth-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { HttpLoggerMiddleware } from './common/logger/http-logger.middleware';
import { setupSwagger } from './swagger.config';

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

  // Swagger
  const swaggerEnabled = setupSwagger(app, configService, loggerService);

  const port = configService.get<number>('PORT', 4101);
  const host = configService.get<string>('HOST', '0.0.0.0');
  await app.listen(port, host);

  loggerService.log(
    `🚀 Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
  if (swaggerEnabled) {
    loggerService.log(
      `📚 Swagger documentation: http://localhost:${port}/api`,
      'Bootstrap',
    );
  }
}

bootstrap();
