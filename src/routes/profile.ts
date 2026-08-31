import { Router } from "express";
import { prisma } from "@/db";
import { syncUser } from "@/services/sync";
import { AppError } from "@/utils/errors";

const router = Router();

// insensitive : les pseudos PSN sont case-insensitive ("NeyZaku" = "neyzaku")
function findUserByUsername(username: string) {
    return prisma.user.findFirst({
        where: { username: { equals: username, mode: "insensitive" } },
        include: {
            stats: true,
            games: {
                include: {
                    // _count.trophies = nombre total de trophées définis pour ce jeu
                    game: { include: { _count: { select: { trophies: true } } } },
                },
                orderBy: { lastUpdatedDateTime: "desc" },
            },
        },
    });
}

// GET /api/profile/:username
// Si le joueur est en DB, retourne ses données directement.
// Si pas encore connu, déclenche une sync PSN puis retourne.
router.get("/:username", async (req, res, next) => {
    try {
        const { username } = req.params;

        let user = await findUserByUsername(username);

        if (!user) {
            await syncUser(username);
            user = await findUserByUsername(username);
        }

        if (!user) {
            return next(new AppError(404, "Joueur PSN introuvable."));
        }

        // Compte les trophées débloqués par le joueur, regroupés par jeu.
        const earnedRows = await prisma.userTrophy.findMany({
            where: { userId: user.psnId },
            select: { trophy: { select: { gameId: true } } },
        });
        const earnedByGame = new Map<string, number>();
        for (const row of earnedRows) {
            earnedByGame.set(row.trophy.gameId, (earnedByGame.get(row.trophy.gameId) ?? 0) + 1);
        }

        res.json({
            psnId: user.psnId,
            username: user.username,
            avatarUrl: user.avatarUrl,
            stats: user.stats,
            games: user.games.map((ug) => ({
                gameId: ug.gameId,
                lastUpdatedDateTime: ug.lastUpdatedDateTime,
                earned: earnedByGame.get(ug.gameId) ?? 0,
                total: ug.game._count.trophies,
                game: {
                    id: ug.game.id,
                    title: ug.game.title,
                    platform: ug.game.platform,
                    iconUrl: ug.game.iconUrl,
                },
            })),
        });
    } catch (err) {
        if (err instanceof Error && err.message.includes("User not found")) {
            return next(new AppError(404, "Joueur PSN inexistant."));
        }
        next(err);
    }
});

export default router;
