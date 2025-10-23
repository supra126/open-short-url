-- AlterTable
ALTER TABLE "clicks" ADD COLUMN     "botName" TEXT,
ADD COLUMN     "isBot" BOOLEAN NOT NULL DEFAULT false;
