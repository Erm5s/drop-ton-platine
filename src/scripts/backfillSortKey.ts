import { prisma } from "@/db";
import { buildGameSortKey } from "@/utils/trophyTitleName";

/**
 * Recalcule la clé de tri de tous les jeux déjà en base.
 *
 * À relancer si la logique de `buildGameSortKey` change. Les mises à jour partent par lots
 * via un seul UPDATE ... FROM : 42 000 requêtes unitaires prendraient plusieurs minutes.
 */
const BATCH_SIZE = 2000;

const games = await prisma.game.findMany({ select: { id: true, title: true } });
console.log(`${games.length} jeux à traiter`);

let done = 0;
for (let start = 0; start < games.length; start += BATCH_SIZE) {
    const batch = games.slice(start, start + BATCH_SIZE);
    const ids = batch.map(g => g.id);
    const keys = batch.map(g => buildGameSortKey(g.title));

    await prisma.$executeRaw`
        UPDATE "Game" AS g
        SET "sortKey" = data.key
        FROM (SELECT unnest(${ids}::text[]) AS id, unnest(${keys}::text[]) AS key) AS data
        WHERE g.id = data.id
    `;

    done += batch.length;
    console.log(`  ${done}/${games.length}`);
}

console.log("Terminé.");
process.exit(0);
