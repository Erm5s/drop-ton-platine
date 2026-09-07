-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "sortKey" TEXT NOT NULL DEFAULT '';


-- Collation "C" : tri par octets, seul moyen d'obtenir l'ordre ponctuation < chiffres <
-- latin < reste. La collation en_US.utf8 de la base ignorerait la ponctuation.
ALTER TABLE "Game" ALTER COLUMN "sortKey" TYPE text COLLATE "C";

-- CreateIndex
CREATE INDEX "Game_sortKey_id_idx" ON "Game"("sortKey", "id");
