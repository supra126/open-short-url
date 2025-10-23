-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UrlStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "urls" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "title" TEXT,
    "userId" TEXT NOT NULL,
    "status" "UrlStatus" NOT NULL DEFAULT 'ACTIVE',
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "password" TEXT,
    "expiresAt" TIMESTAMP(3),
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clicks" (
    "id" TEXT NOT NULL,
    "urlId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "device" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "keyHash" TEXT,
    "prefix" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "urls_slug_key" ON "urls"("slug");

-- CreateIndex
CREATE INDEX "urls_userId_status_createdAt_idx" ON "urls"("userId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "urls_userId_clickCount_idx" ON "urls"("userId", "clickCount" DESC);

-- CreateIndex
CREATE INDEX "urls_slug_idx" ON "urls"("slug");

-- CreateIndex
CREATE INDEX "urls_status_expiresAt_idx" ON "urls"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "urls_expiresAt_idx" ON "urls"("expiresAt");

-- CreateIndex
CREATE INDEX "clicks_urlId_createdAt_idx" ON "clicks"("urlId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "clicks_urlId_country_idx" ON "clicks"("urlId", "country");

-- CreateIndex
CREATE INDEX "clicks_urlId_browser_idx" ON "clicks"("urlId", "browser");

-- CreateIndex
CREATE INDEX "clicks_urlId_os_idx" ON "clicks"("urlId", "os");

-- CreateIndex
CREATE INDEX "clicks_urlId_device_idx" ON "clicks"("urlId", "device");

-- CreateIndex
CREATE INDEX "clicks_createdAt_idx" ON "clicks"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "urls" ADD CONSTRAINT "urls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
