-- CreateTable
CREATE TABLE IF NOT EXISTS "EncyclopediaReviewRecord" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "surface" TEXT,
    "problem" TEXT,
    "intent" TEXT,
    "sections" JSONB NOT NULL,
    "internalLinks" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EncyclopediaReviewRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EncyclopediaReviewRecord_slug_key" ON "EncyclopediaReviewRecord"("slug");
