-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('URL_CREATED', 'URL_UPDATED', 'URL_DELETED', 'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'API_KEY_CREATED', 'API_KEY_DELETED', 'SETTINGS_UPDATED', 'PASSWORD_CHANGED', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'VARIANT_CREATED', 'VARIANT_UPDATED', 'VARIANT_DELETED', 'BUNDLE_CREATED', 'BUNDLE_UPDATED', 'BUNDLE_DELETED', 'WEBHOOK_CREATED', 'WEBHOOK_UPDATED', 'WEBHOOK_DELETED');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
