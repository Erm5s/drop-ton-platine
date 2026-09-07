-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "bronze" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "gold" INTEGER,
ADD COLUMN     "npServiceName" TEXT,
ADD COLUMN     "platinum" INTEGER,
ADD COLUMN     "silver" INTEGER;

-- CreateTable
CREATE TABLE "CatalogScan" (
    "id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "found" BOOLEAN NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogScan_index_key" ON "CatalogScan"("index");

-- CreateIndex
CREATE INDEX "CatalogScan_found_idx" ON "CatalogScan"("found");
