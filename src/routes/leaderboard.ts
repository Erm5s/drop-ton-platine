import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/db";
import { rankForPoints } from "@/services/rank";
import { playerPointsSql } from "@/services/score";
import { AppError } from "@/utils/errors";

const router = Router();

// Nombre de joueurs par page
const PAGE_SIZE = 10;

const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
});

/** Une ligne telle que Postgres la renvoie, avant calcul du rang et du numéro de place. */
type Row = {
    psnId: string;
    username: string;
    avatarUrl: string | null;
    points: number;
    level: number;
    progress: number;
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    /** Nombre total de joueurs, recopié sur chaque ligne par la fenêtre count(*). */
    total: number;
};

// GET /api/leaderboard?page=1
router.get("/", async (req, res, next) => {
    try {
        const parsed = listQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return next(new AppError(400, "Paramètres de pagination invalides."));
        }

        const { page } = parsed.data;

        // Les points viennent du fragment partagé avec les compteurs du site
        const rows = await prisma.$queryRaw<Row[]>`
            ${playerPointsSql}
            SELECT
                joueur."psnId",
                joueur.username,
                joueur."avatarUrl",
                -- Un joueur sans jeu synchronisé n'apparaît pas dans totaux
                coalesce(total.points, 0) AS points,
                coalesce(stats.level, 0) AS level,
                coalesce(stats.progress, 0) AS progress,
                coalesce(stats.bronze, 0) AS bronze,
                coalesce(stats.silver, 0) AS silver,
                coalesce(stats.gold, 0) AS gold,
                coalesce(stats.platinum, 0) AS platinum,
                -- Compté dans la même requête : une seconde requête de comptage referait
                -- tout le calcul de points pour rien
                count(*) OVER ()::int AS total
            FROM "User" joueur
            LEFT JOIN totaux total ON total."userId" = joueur."psnId"
            LEFT JOIN "UserStats" stats ON stats."psnId" = joueur."psnId"
            -- Le pseudo départage les ex æquo, sans quoi la pagination pourrait répéter
            -- ou sauter un joueur d'une page à l'autre
            ORDER BY points DESC, joueur.username ASC
            LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
        `;

        const total = rows[0]?.total ?? 0;
        const offset = (page - 1) * PAGE_SIZE;

        res.json({
            players: rows.map((row, index) => {
                const rank = rankForPoints(row.points);
                return {
                    position: offset + index + 1,
                    psnId: row.psnId,
                    username: row.username,
                    avatarUrl: row.avatarUrl,
                    points: row.points,
                    rank: { tier: rank.tier, label: rank.label },
                    // Niveau PSN et progression vers le suivant, en pourcentage
                    level: row.level,
                    progress: row.progress,
                    bronze: row.bronze,
                    silver: row.silver,
                    gold: row.gold,
                    platinum: row.platinum,
                    trophies: row.bronze + row.silver + row.gold + row.platinum,
                };
            }),
            total,
            page,
            limit: PAGE_SIZE,
            totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        });
    } catch (err) {
        next(err);
    }
});

export default router;
