import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

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
  console.log('\n📝 Default credentials:');
  console.log('   Email: admin@example.com');
  console.log('   Password: admin123');
  console.log('\n🔗 Sample URL: /demo');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
