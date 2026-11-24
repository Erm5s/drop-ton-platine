import { Router } from "express";
import { prisma } from "@/db";
import { playerPointsSql } from "@/services/score";
import { rankForPoints, type RankTier } from "@/services/rank";

const router = Router();

/** Les métaux, du plus bas au plus haut : l'ordre d'affichage de la répartition. */
const TIERS: RankTier[] = ["bronze", "argent", "or", "platine"];

// GET /api/stats — chiffres du classement : combien de joueurs, à quel rang, pour
// combien de trophées.
router.get("/", async (_req, res, next) => {
    try {
        const [players, trophies] = await Promise.all([
            // Un joueur sans jeu synchronisé compte quand même, à zéro point
            prisma.$queryRaw<{ points: number }[]>`
                ${playerPointsSql}
                SELECT coalesce(total.points, 0) AS points
                FROM "User" joueur
                LEFT JOIN totaux total ON total."userId" = joueur."psnId"
            `,
            prisma.userTrophy.count(),
        ]);

        // Le rang est déduit en JavaScript plutôt qu'en SQL : les paliers sont déjà décrits
        // dans services/rank.ts, les recopier en CASE les ferait diverger tôt ou tard.
        const counts = new Map<RankTier, number>(TIERS.map(tier => [tier, 0]));

        for (const { points } of players) {
            const tier = rankForPoints(points).tier;
            counts.set(tier, (counts.get(tier) ?? 0) + 1);
        }

        res.json({
            players: players.length,
            trophies,
            distribution: TIERS.map(tier => ({ tier, count: counts.get(tier) ?? 0 })),
        });
    } catch (err) {
        next(err);
    }
});

export default router;
