#!/usr/bin/env ts-node
/**
 * Database Maintenance Script
 * Run periodically to maintain optimal database performance
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create pg Pool for Prisma 7.x driver adapter
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface MaintenanceReport {
  timestamp: Date;
  tasks: Array<{
    name: string;
    status: 'success' | 'error';
    details?: any;
    duration?: number;
  }>;
}

class DatabaseMaintenance {
  private report: MaintenanceReport = {
    timestamp: new Date(),
    tasks: [],
  };

  /**
   * Run all maintenance tasks
   */
  async runMaintenance() {
    console.log('🔧 Starting database maintenance...');

    // Task 1: Analyze tables for query optimizer
    await this.runTask('Analyze Tables', async () => {
      await prisma.$executeRaw`ANALYZE;`;
    });

    // Task 2: Update table statistics
    await this.runTask('Update Statistics', async () => {
      const tables = ['urls', 'clicks', 'users', 'api_keys'];
      for (const table of tables) {
        await prisma.$executeRawUnsafe(`ANALYZE ${table};`);
      }
    });

    // Task 3: Check and rebuild bloated indexes
    await this.runTask('Check Index Bloat', async () => {
      const bloatQuery = await prisma.$queryRaw<Array<{
        schemaname: string;
        tablename: string;
        indexname: string;
        index_size: string;
        bloat_pct: number;
      }>>`
        SELECT
          schemaname,
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
          ROUND(100 * (1 - (index_ratio / NULLIF(table_ratio, 0))), 2) AS bloat_pct
        FROM (
          SELECT
            schemaname,
            tablename,
            indexname,
            indexrelid,
            pg_relation_size(indexrelid)::NUMERIC AS index_bytes,
            (CASE WHEN indisunique THEN 1 ELSE 0 END)::NUMERIC AS is_unique,
            pg_relation_size(indrelid)::NUMERIC AS table_bytes,
            GREATEST(pg_relation_size(indexrelid), 1)::NUMERIC / GREATEST(pg_relation_size(indrelid), 1) AS index_ratio,
            1.0 AS table_ratio
          FROM pg_stat_user_indexes
          JOIN pg_index USING (indexrelid)
        ) AS index_data
        WHERE bloat_pct > 30
        ORDER BY bloat_pct DESC;
      `;

      if (bloatQuery.length > 0) {
        console.log('⚠️  Bloated indexes found:', bloatQuery);
        return { bloatedIndexes: bloatQuery };
      }
      return { message: 'No bloated indexes found' };
    });

    // Task 4: Clean expired URLs
    await this.runTask('Clean Expired URLs', async () => {
      const result = await prisma.url.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          status: 'ACTIVE',
        },
        data: {
          status: 'EXPIRED',
        },
      });
      return { expiredUrls: result.count };
    });

    // Task 5: Vacuum tables (non-blocking)
    await this.runTask('Vacuum Analyze', async () => {
      // Run VACUUM ANALYZE on each table (non-blocking)
      const tables = ['urls', 'clicks', 'users', 'api_keys'];
      for (const table of tables) {
        await prisma.$executeRawUnsafe(`VACUUM ANALYZE ${table};`);
      }
    });

    // Task 6: Check slow queries
    await this.runTask('Check Slow Queries', async () => {
      const slowQueries = await prisma.$queryRaw<Array<{
        query: string;
        calls: bigint;
        mean_exec_time: number;
        total_exec_time: number;
      }>>`
        SELECT
          LEFT(query, 100) as query,
          calls,
          ROUND(mean_exec_time::numeric, 2) as mean_exec_time,
          ROUND(total_exec_time::numeric, 2) as total_exec_time
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        AND mean_exec_time > 100
        ORDER BY mean_exec_time DESC
        LIMIT 10;
      `;

      if (slowQueries.length > 0) {
        console.log('⚠️  Slow queries detected:', slowQueries);
        return { slowQueries };
      }
      return { message: 'No slow queries found' };
    });

    // Task 7: Check connection pool usage
    await this.runTask('Check Connection Pool', async () => {
      const connections = await prisma.$queryRaw<Array<{
        datname: string;
        active: bigint;
        idle: bigint;
        total: bigint;
      }>>`
        SELECT
          datname,
          COUNT(*) FILTER (WHERE state = 'active') as active,
          COUNT(*) FILTER (WHERE state = 'idle') as idle,
          COUNT(*) as total
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY datname;
      `;

      return connections[0];
    });

    // Task 8: Check table sizes
    await this.runTask('Check Table Sizes', async () => {
      const tableSizes = await prisma.$queryRaw<Array<{
        tablename: string;
        size: string;
        rows_estimate: bigint;
      }>>`
        SELECT
          relname AS tablename,
          pg_size_pretty(pg_total_relation_size(relid)) AS size,
          n_live_tup AS rows_estimate
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(relid) DESC;
      `;

      return tableSizes;
    });

    // Task 9: Archive old click data
    await this.runTask('Archive Old Clicks', async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days

      // First, check how many records would be archived
      const count = await prisma.click.count({
        where: { createdAt: { lt: cutoffDate } },
      });

      if (count > 0) {
        console.log(`📦 Archiving ${count} click records older than ${cutoffDate.toISOString()}`);

        // In production, you might want to:
        // 1. Export to data warehouse
        // 2. Create aggregated statistics
        // 3. Then delete the records

        // For now, just return the count
        return { recordsToArchive: count };
      }
      return { message: 'No records to archive' };
    });

    // Generate report
    this.generateReport();
  }

  /**
   * Run a single maintenance task with error handling
   */
  private async runTask(name: string, task: () => Promise<any>) {
    const startTime = Date.now();
    console.log(`⏳ Running: ${name}...`);

    try {
      const result = await task();
      const duration = Date.now() - startTime;

      this.report.tasks.push({
        name,
        status: 'success',
        details: result,
        duration,
      });

      console.log(`✅ Completed: ${name} (${duration}ms)`);
    } catch (error) {
      this.report.tasks.push({
        name,
        status: 'error',
        details: error.message,
      });

      console.error(`❌ Failed: ${name}`, error);
    }
  }

  /**
   * Generate maintenance report
   */
  private generateReport() {
    console.log('\n📊 Maintenance Report');
    console.log('=' .repeat(50));
    console.log(`Timestamp: ${this.report.timestamp.toISOString()}`);
    console.log(`Total tasks: ${this.report.tasks.length}`);
    console.log(`Successful: ${this.report.tasks.filter(t => t.status === 'success').length}`);
    console.log(`Failed: ${this.report.tasks.filter(t => t.status === 'error').length}`);
    console.log('\nTask Details:');
    console.log('-'.repeat(50));

    this.report.tasks.forEach(task => {
      const statusEmoji = task.status === 'success' ? '✅' : '❌';
      console.log(`${statusEmoji} ${task.name}`);
      if (task.duration) {
        console.log(`   Duration: ${task.duration}ms`);
      }
      if (task.details) {
        console.log(`   Details:`, JSON.stringify(task.details, null, 2));
      }
    });

    console.log('=' .repeat(50));
  }
}

// Run maintenance
async function main() {
  const maintenance = new DatabaseMaintenance();

  try {
    await maintenance.runMaintenance();
  } catch (error) {
    console.error('Maintenance failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { DatabaseMaintenance };