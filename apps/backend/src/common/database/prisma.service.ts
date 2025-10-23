import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

/**
 * Optimized Prisma Service with connection pool configuration and performance monitoring
 *
 * Connection Pool Configuration:
 * Add these parameters to your DATABASE_URL in .env file:
 * - connection_limit: Maximum number of connections (default: 10, recommended: 10-20)
 * - pool_timeout: Connection pool timeout in seconds (default: 10)
 * - connect_timeout: Connection timeout in seconds (default: 5)
 *
 * Example:
 * DATABASE_URL="postgresql://user:password@localhost:5432/db?connection_limit=15&pool_timeout=20&connect_timeout=5"
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second

  constructor(private configService: ConfigService) {
    const isDevelopment = configService.get<string>('NODE_ENV') === 'development';

    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
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
    });

    // Monitor slow queries in development
    if (isDevelopment) {
      this.$on('query' as never, (e: any) => {
        if (e.duration > this.SLOW_QUERY_THRESHOLD) {
          this.logger.warn(
            `Slow query detected (${e.duration}ms): ${e.query.substring(0, 100)}...`,
          );
        }
      });
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');

      // Log connection pool info
      const dbUrl = this.configService.get<string>('DATABASE_URL');
      if (dbUrl?.includes('connection_limit=')) {
        const match = dbUrl.match(/connection_limit=(\d+)/);
        if (match) {
          this.logger.log(`📊 Connection pool limit: ${match[1]}`);
        }
      } else {
        this.logger.warn(
          '⚠️  No connection_limit configured. Using default. ' +
          'Consider adding connection pool parameters to DATABASE_URL for better performance.'
        );
      }
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('👋 Database disconnected');
  }

  async cleanDatabase() {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Get all table names
    const tables = await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    // Truncate all tables
    for (const { tablename } of tables) {
      if (tablename !== '_prisma_migrations') {
        try {
          await this.$executeRawUnsafe(
            `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
          );
        } catch (error) {
          this.logger.error(`Could not truncate ${tablename}`, error);
        }
      }
    }
  }
}
