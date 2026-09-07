/*
  Warnings:

  - The primary key for the `Trophy` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Trophy` table. All the data in the column will be lost.
  - You are about to drop the column `rarity` on the `Trophy` table. All the data in the column will be lost.
  - You are about to drop the column `trophyGroupId` on the `Trophy` table. All the data in the column will be lost.
  - The primary key for the `TrophyGroup` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TrophyGroup` table. All the data in the column will be lost.
  - The primary key for the `UserTrophy` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `groupId` to the `Trophy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trophyId` to the `Trophy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Trophy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameId` to the `UserTrophy` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `trophyId` on the `UserTrophy` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TrophyType" AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- CreateEnum
CREATE TYPE "TrophyRareness" AS ENUM ('ultraRare', 'veryRare', 'rare', 'common');

-- DropForeignKey
ALTER TABLE "Trophy" DROP CONSTRAINT "Trophy_trophyGroupId_fkey";

-- DropForeignKey
ALTER TABLE "UserTrophy" DROP CONSTRAINT "UserTrophy_trophyId_fkey";

-- DropIndex
DROP INDEX "Trophy_gameId_idx";

-- DropIndex
DROP INDEX "Trophy_rarity_idx";

-- DropIndex
DROP INDEX "TrophyGroup_gameId_idx";

-- DropIndex
DROP INDEX "UserTrophy_userId_idx";

-- AlterTable
ALTER TABLE "Trophy" DROP CONSTRAINT "Trophy_pkey",
DROP COLUMN "id",
DROP COLUMN "rarity",
DROP COLUMN "trophyGroupId",
ADD COLUMN     "earnedRate" DOUBLE PRECISION,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rareness" "TrophyRareness",
ADD COLUMN     "trophyId" INTEGER NOT NULL,
ADD COLUMN     "type" "TrophyType" NOT NULL,
ADD CONSTRAINT "Trophy_pkey" PRIMARY KEY ("gameId", "trophyId");

-- AlterTable
ALTER TABLE "TrophyGroup" DROP CONSTRAINT "TrophyGroup_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "TrophyGroup_pkey" PRIMARY KEY ("gameId", "groupId");

-- AlterTable
ALTER TABLE "UserTrophy" DROP CONSTRAINT "UserTrophy_pkey",
ADD COLUMN     "gameId" TEXT NOT NULL,
DROP COLUMN "trophyId",
ADD COLUMN     "trophyId" INTEGER NOT NULL,
ADD CONSTRAINT "UserTrophy_pkey" PRIMARY KEY ("userId", "gameId", "trophyId");

-- DropEnum
DROP TYPE "TrophyRarity";

-- CreateIndex
CREATE INDEX "UserTrophy_gameId_trophyId_earnedAt_idx" ON "UserTrophy"("gameId", "trophyId", "earnedAt");

-- AddForeignKey
ALTER TABLE "Trophy" ADD CONSTRAINT "Trophy_gameId_groupId_fkey" FOREIGN KEY ("gameId", "groupId") REFERENCES "TrophyGroup"("gameId", "groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrophy" ADD CONSTRAINT "UserTrophy_gameId_trophyId_fkey" FOREIGN KEY ("gameId", "trophyId") REFERENCES "Trophy"("gameId", "trophyId") ON DELETE RESTRICT ON UPDATE CASCADE;
