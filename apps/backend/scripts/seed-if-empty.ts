#!/usr/bin/env tsx
/**
 * Auto-seed database if it's empty
 * This script checks if the database has any users, and if not, runs the seed script
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking if database needs seeding...');

  try {
    // Check if there are any users in the database
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      console.log('📊 Database is empty. Running seed...');

      // Run the seed script
      execSync('yarn prisma:seed', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      console.log('✅ Database seeded successfully!');
    } else {
      console.log(`✓ Database already has data (${userCount} users). Skipping seed.`);
    }
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
