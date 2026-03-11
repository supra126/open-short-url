-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'SSO_LOGIN';
ALTER TYPE "AuditAction" ADD VALUE 'SSO_LOGIN_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'OIDC_PROVIDER_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'OIDC_PROVIDER_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'OIDC_PROVIDER_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'OIDC_ACCOUNT_LINKED';
ALTER TYPE "AuditAction" ADD VALUE 'OIDC_ACCOUNT_UNLINKED';
ALTER TYPE "AuditAction" ADD VALUE 'SYSTEM_SETTING_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'SYSTEM_SETTING_DELETED';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';

-- CreateTable
CREATE TABLE "oidc_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "discoveryUrl" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT 'openid email profile',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oidc_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oidc_accounts" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oidc_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oidc_providers_slug_key" ON "oidc_providers"("slug");

-- CreateIndex
CREATE INDEX "oidc_accounts_userId_idx" ON "oidc_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oidc_accounts_providerId_sub_key" ON "oidc_accounts"("providerId", "sub");

-- CreateIndex
CREATE INDEX "clicks_urlId_isBot_createdAt_idx" ON "clicks"("urlId", "isBot", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "clicks_urlId_variantId_isBot_createdAt_idx" ON "clicks"("urlId", "variantId", "isBot", "createdAt");

-- AddForeignKey
ALTER TABLE "oidc_accounts" ADD CONSTRAINT "oidc_accounts_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "oidc_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oidc_accounts" ADD CONSTRAINT "oidc_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
