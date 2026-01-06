import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

/**
 * Optimized Prisma Service with connection pool configuration and performance monitoring
 * Updated for Prisma 7 using @prisma/adapter-pg
 *
 * Connection Pool Configuration:
 * The pg Pool handles connection pooling. Configure via DATABASE_URL or Pool options.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private pool: Pool;

  constructor(
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    const isDevelopment = configService.get<string>('NODE_ENV') === 'development';

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create pg Pool for connection management with optimized settings
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 20,                      // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,     // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection not available
    });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: isDevelopment
        ? [
            { level: 'query', emit: 'event' },
            { level: 'info', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
            { level: 'error', emit: 'stdout' },
          ]
        : [
            { level: 'error', emit: 'stdout' },
          ],
      errorFormat: isDevelopment ? 'pretty' : 'minimal',
    });

    this.pool = pool;

    // Monitor slow queries in development
    if (isDevelopment) {
      // Prisma 7 uses $on method for event subscription
      // The query event provides query details including duration
      interface PrismaQueryEvent {
        query: string;
        params: string;
        duration: number;
        target: string;
      }

      // Use type assertion for Prisma event subscription
      const client = this as unknown as {
        $on: (event: 'query', callback: (e: PrismaQueryEvent) => void) => void;
      };
      client.$on('query', (e: PrismaQueryEvent) => {
        if (e.duration > this.SLOW_QUERY_THRESHOLD) {
          this.loggerService.logDatabaseQuery(
            e.query,
            e.duration,
            true,
          );
        }
      });
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.loggerService.log(
        '✅ Database connected successfully',
        'PrismaService',
      );
    } catch (error) {
      this.loggerService.error(
        '❌ Failed to connect to database',
        error instanceof Error ? error.stack : String(error),
        'PrismaService',
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.loggerService.log('👋 Database disconnected', 'PrismaService');
  }

  // Regex pattern for valid PostgreSQL table names (lowercase letters and underscores only)
  private readonly TABLE_NAME_PATTERN = /^[a-z_]+$/;

  // Whitelist of allowed table names to prevent SQL injection
  private readonly ALLOWED_TABLES = [
    'users',
    'urls',
    'clicks',
    'api_keys',
    'system_settings',
    'url_variants',
    'webhooks',
    'webhook_logs',
    'bundles',
    'bundle_urls',
  ];

  async cleanDatabase() {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Get all table names
    const tables = await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    // Truncate only whitelisted tables to prevent SQL injection
    for (const { tablename } of tables) {
      if (tablename === '_prisma_migrations') {
        continue;
      }

      // Validate table name format (defense in depth)
      if (!this.TABLE_NAME_PATTERN.test(tablename)) {
        this.loggerService.error(
          `Invalid table name format: ${tablename}`,
          undefined,
          'PrismaService',
        );
        continue;
      }

      // Validate table name against whitelist
      if (!this.ALLOWED_TABLES.includes(tablename)) {
        this.loggerService.warn(
          `Skipping unknown table: ${tablename}`,
          'PrismaService',
        );
        continue;
      }

      try {
        // Execute with validated table name (whitelist + format validated)
        await this.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
        );
      } catch (error) {
        this.loggerService.error(
          `Could not truncate ${tablename}`,
          error instanceof Error ? error.stack : String(error),
          'PrismaService',
        );
      }
    }
  }

  /**
   * Health check for database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.loggerService.error(
        'Database health check failed',
        error instanceof Error ? error.stack : String(error),
        'PrismaService',
      );
      return false;
    }
  }
}
