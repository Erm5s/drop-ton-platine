-- pg_trgm fournit gin_trgm_ops, requis par l' index ci-dessous
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Game_title_trgm_idx" ON "Game" USING GIN ("title" gin_trgm_ops);
