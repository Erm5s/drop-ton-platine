-- AlterTable
ALTER TABLE "Trophy" ALTER COLUMN "trophyGroupId" DROP DEFAULT;

-- CreateTable
CREATE TABLE "TrophyGroup" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconUrl" TEXT,

    CONSTRAINT "TrophyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrophyGroup_gameId_idx" ON "TrophyGroup"("gameId");

-- AddForeignKey
ALTER TABLE "TrophyGroup" ADD CONSTRAINT "TrophyGroup_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trophy" ADD CONSTRAINT "Trophy_trophyGroupId_fkey" FOREIGN KEY ("trophyGroupId") REFERENCES "TrophyGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
