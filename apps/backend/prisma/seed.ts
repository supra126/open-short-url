import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // Get admin password from environment variable or generate a secure random one
  let adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  let isGeneratedPassword = false;

  if (!adminPassword) {
    // Generate a secure random password if not provided
    adminPassword = crypto.randomBytes(16).toString('base64').slice(0, 20);
    isGeneratedPassword = true;
    console.log('⚠️  ADMIN_INITIAL_PASSWORD not set, generating random password...');
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample URL
  const sampleUrl = await prisma.url.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      originalUrl: 'https://github.com/supra126/open-short-url',
      title: 'Open Short URL GitHub',
      userId: admin.id,
      status: 'ACTIVE',
      utmSource: 'demo',
      utmMedium: 'seed',
      utmCampaign: 'initial_setup',
    },
  });

  console.log('✅ Created/Updated sample URL:', sampleUrl.slug);

  // Create system settings for white-labeling
  const brandingSettings = [
    {
      key: 'branding.brandName',
      value: 'Open Short URL',
      description: 'Brand name',
    },
    {
      key: 'branding.logoUrl',
      value: '/logo.svg',
      description: 'Logo URL',
    },
    {
      key: 'branding.primaryColor',
      value: '#3b82f6',
      description: 'Primary color',
    },
    {
      key: 'branding.secondaryColor',
      value: '#8b5cf6',
      description: 'Secondary color',
    },
    {
      key: 'branding.siteTitle',
      value: 'Open Short URL',
      description: 'Site title',
    },
    {
      key: 'branding.siteDescription',
      value: 'A powerful URL shortener service',
      description: 'Site description',
    },
  ];

  for (const setting of brandingSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        description: setting.description,
      },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    });
  }

  console.log('✅ Created branding system settings:', brandingSettings.length, 'entries');

  console.log('🎉 Database seeding completed!');
  console.log('\n📝 Admin credentials:');
  console.log('   Email: admin@example.com');
  if (isGeneratedPassword) {
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Save this password! It will not be shown again.');
    console.log('   For production, set ADMIN_INITIAL_PASSWORD environment variable.');
  } else {
    console.log('   Password: (set via ADMIN_INITIAL_PASSWORD)');
  }
  console.log('\n🔗 Sample URL: /demo');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
