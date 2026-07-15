-- CreateEnum
CREATE TYPE "PodcastSyncStatus" AS ENUM ('PENDING', 'IMPORTING', 'SUCCESS', 'FAILED', 'DISABLED');

-- CreateEnum
CREATE TYPE "EpisodeType" AS ENUM ('FULL', 'TRAILER', 'BONUS');

-- AlterTable
ALTER TABLE "podcasts"
ADD COLUMN "rssUrl" TEXT,
ADD COLUMN "websiteUrl" TEXT,
ADD COLUMN "language" TEXT,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "copyright" TEXT,
ADD COLUMN "author" TEXT,
ADD COLUMN "ownerName" TEXT,
ADD COLUMN "ownerEmail" TEXT,
ADD COLUMN "explicit" BOOLEAN,
ADD COLUMN "generator" TEXT,
ADD COLUMN "lastBuildDate" TIMESTAMP(3),
ADD COLUMN "lastSyncAt" TIMESTAMP(3),
ADD COLUMN "syncStatus" "PodcastSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "episodes"
ADD COLUMN "guid" TEXT,
ADD COLUMN "summary" TEXT,
ADD COLUMN "audioMimeType" TEXT,
ADD COLUMN "audioLength" INTEGER,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "season" INTEGER,
ADD COLUMN "episode" INTEGER,
ADD COLUMN "episodeType" "EpisodeType",
ADD COLUMN "explicit" BOOLEAN;

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_rssUrl_key" ON "podcasts"("rssUrl");

-- CreateIndex
CREATE INDEX "podcasts_syncStatus_idx" ON "podcasts"("syncStatus");

-- CreateIndex
CREATE INDEX "podcasts_lastSyncAt_idx" ON "podcasts"("lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_guid_key" ON "episodes"("guid");

-- CreateIndex
CREATE INDEX "episodes_publishedAt_idx" ON "episodes"("publishedAt");

-- CreateIndex
CREATE INDEX "episodes_podcastId_idx" ON "episodes"("podcastId");
