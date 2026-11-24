-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "canonicalId" TEXT;

-- CreateIndex
CREATE INDEX "Game_canonicalId_idx" ON "Game"("canonicalId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_canonicalId_fkey" FOREIGN KEY ("canonicalId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
