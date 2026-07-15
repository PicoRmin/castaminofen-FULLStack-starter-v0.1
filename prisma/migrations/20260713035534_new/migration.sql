-- AlterTable
ALTER TABLE "search_analytics_events" ALTER COLUMN "filters" SET DATA TYPE JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "refreshTokenHash" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- RenameIndex
ALTER INDEX "search_analytics_events_createdAt_index" RENAME TO "search_analytics_events_createdAt_idx";

-- RenameIndex
ALTER INDEX "search_recent_queries_userId_index" RENAME TO "search_recent_queries_userId_idx";

-- RenameIndex
ALTER INDEX "search_synonyms_source_index" RENAME TO "search_synonyms_source_idx";

-- RenameIndex
ALTER INDEX "search_synonyms_target_index" RENAME TO "search_synonyms_target_idx";
