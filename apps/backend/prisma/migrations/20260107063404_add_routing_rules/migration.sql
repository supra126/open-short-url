-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'ROUTING_RULE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ROUTING_RULE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ROUTING_RULE_DELETED';

-- AlterTable
ALTER TABLE "clicks" ADD COLUMN     "routingRuleId" TEXT;

-- AlterTable
ALTER TABLE "urls" ADD COLUMN     "defaultUrl" TEXT,
ADD COLUMN     "isSmartRouting" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "routing_rules" (
    "id" TEXT NOT NULL,
    "urlId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB NOT NULL,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "routing_rules_urlId_priority_isActive_idx" ON "routing_rules"("urlId", "priority" DESC, "isActive");

-- CreateIndex
CREATE INDEX "routing_rules_urlId_matchCount_idx" ON "routing_rules"("urlId", "matchCount" DESC);

-- CreateIndex
CREATE INDEX "clicks_routingRuleId_createdAt_idx" ON "clicks"("routingRuleId", "createdAt");

-- CreateIndex
CREATE INDEX "clicks_urlId_isBot_routingRuleId_createdAt_idx" ON "clicks"("urlId", "isBot", "routingRuleId", "createdAt");

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_routingRuleId_fkey" FOREIGN KEY ("routingRuleId") REFERENCES "routing_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_rules" ADD CONSTRAINT "routing_rules_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
