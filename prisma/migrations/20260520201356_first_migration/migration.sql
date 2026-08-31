-- CreateEnum
CREATE TYPE "TrophyRarity" AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "psnId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT,
    "iconUrl" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trophy" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rarity" "TrophyRarity" NOT NULL,
    "iconUrl" TEXT,

    CONSTRAINT "Trophy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrophy" (
    "userId" TEXT NOT NULL,
    "trophyId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTrophy_pkey" PRIMARY KEY ("userId","trophyId")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" INTEGER NOT NULL,
    "refreshToken" TEXT,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_psnId_key" ON "User"("psnId");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "Game_title_idx" ON "Game"("title");

-- CreateIndex
CREATE INDEX "Trophy_gameId_idx" ON "Trophy"("gameId");

-- CreateIndex
CREATE INDEX "Trophy_rarity_idx" ON "Trophy"("rarity");

-- CreateIndex
CREATE INDEX "UserTrophy_userId_idx" ON "UserTrophy"("userId");

-- CreateIndex
CREATE INDEX "UserTrophy_earnedAt_idx" ON "UserTrophy"("earnedAt");

-- AddForeignKey
ALTER TABLE "Trophy" ADD CONSTRAINT "Trophy_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrophy" ADD CONSTRAINT "UserTrophy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrophy" ADD CONSTRAINT "UserTrophy_trophyId_fkey" FOREIGN KEY ("trophyId") REFERENCES "Trophy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
