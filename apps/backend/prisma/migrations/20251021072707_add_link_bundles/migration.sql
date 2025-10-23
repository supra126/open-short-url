-- CreateEnum
CREATE TYPE "BundleStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "bundles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "icon" TEXT DEFAULT '📦',
    "status" "BundleStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_urls" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "urlId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundle_urls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bundles_userId_status_idx" ON "bundles"("userId", "status");

-- CreateIndex
CREATE INDEX "bundles_userId_createdAt_idx" ON "bundles"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "bundle_urls_bundleId_order_idx" ON "bundle_urls"("bundleId", "order");

-- CreateIndex
CREATE INDEX "bundle_urls_urlId_idx" ON "bundle_urls"("urlId");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_urls_bundleId_urlId_key" ON "bundle_urls"("bundleId", "urlId");

-- AddForeignKey
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_urls" ADD CONSTRAINT "bundle_urls_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_urls" ADD CONSTRAINT "bundle_urls_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
