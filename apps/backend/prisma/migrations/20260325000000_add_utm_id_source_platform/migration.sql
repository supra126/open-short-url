-- AlterTable: Add GA4 recommended UTM fields to urls
ALTER TABLE "urls" ADD COLUMN "utmId" TEXT;
ALTER TABLE "urls" ADD COLUMN "utmSourcePlatform" TEXT;

-- AlterTable: Add GA4 recommended UTM fields to clicks
ALTER TABLE "clicks" ADD COLUMN "utmId" TEXT;
ALTER TABLE "clicks" ADD COLUMN "utmSourcePlatform" TEXT;
