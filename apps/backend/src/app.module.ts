import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './common/database/database.module';
import { CacheModule } from './common/cache/cache.module';
import { LoggerModule } from './common/logger/logger.module';
import { ThrottlerStorageModule } from './common/throttler/throttler.module';
import { HybridThrottlerStorage } from './common/throttler/hybrid-throttler-storage';
import { ServicesModule } from './common/services/services.module';
import { AuthModule } from './modules/auth/auth.module';
import { UrlModule } from './modules/url/url.module';
import { RedirectModule } from './modules/redirect/redirect.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { UsersModule } from './modules/users/users.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { BundleModule } from './modules/bundle/bundle.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { RoutingModule } from './modules/routing/routing.module';

@Module({
  imports: [
    // Config module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Event emitter (for async operations)
    EventEmitterModule.forRoot({
      // Configure event emitter for asynchronous mode
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // Throttler storage (Redis + in-memory fallback)
    ThrottlerStorageModule,

    // Rate limiting with hybrid storage
    ThrottlerModule.forRootAsync({
      imports: [ThrottlerStorageModule],
      inject: [HybridThrottlerStorage],
      useFactory: (storage: HybridThrottlerStorage) => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
            limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
          },
        ],
        storage,
      }),
    }),

    // Database
    DatabaseModule,

    // Cache
    CacheModule,

    // Logger
    LoggerModule,

    // Shared Services
    ServicesModule,

    // Feature modules
    AuthModule,
    UsersModule,
    UrlModule,
    BundleModule,
    AnalyticsModule,
    SettingsModule,
    ApiKeysModule,
    WebhookModule,
    AuditLogModule,
    RoutingModule,
    // RedirectModule must be last to match /:slug after specific routes
    RedirectModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
