/*
  Warnings:

  - You are about to drop the column `level` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "level";

-- CreateTable
CREATE TABLE "UserStats" (
    "psnId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "bronze" INTEGER NOT NULL DEFAULT 0,
    "silver" INTEGER NOT NULL DEFAULT 0,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "platinum" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("psnId")
);

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_psnId_fkey" FOREIGN KEY ("psnId") REFERENCES "User"("psnId") ON DELETE RESTRICT ON UPDATE CASCADE;
