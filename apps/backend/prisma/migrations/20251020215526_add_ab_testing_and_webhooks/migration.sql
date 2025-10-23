-- AlterTable
ALTER TABLE "clicks" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "urls" ADD COLUMN     "isAbTest" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "url_variants" (
    "id" TEXT NOT NULL,
    "urlId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "url_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "events" JSONB NOT NULL,
    "headers" JSONB,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalSuccess" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "response" TEXT,
    "error" TEXT,
    "duration" INTEGER,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "isSuccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "url_variants_urlId_isActive_idx" ON "url_variants"("urlId", "isActive");

-- CreateIndex
CREATE INDEX "url_variants_urlId_clickCount_idx" ON "url_variants"("urlId", "clickCount" DESC);

-- CreateIndex
CREATE INDEX "webhooks_userId_isActive_idx" ON "webhooks"("userId", "isActive");

-- CreateIndex
CREATE INDEX "webhook_logs_webhookId_createdAt_idx" ON "webhook_logs"("webhookId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "clicks_variantId_createdAt_idx" ON "clicks"("variantId", "createdAt");

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "url_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "url_variants" ADD CONSTRAINT "url_variants_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
