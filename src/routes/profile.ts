import { Router } from "express";
import { prisma } from "@/db";
import { syncUser } from "@/services/sync";
import { getUserGameScores } from "@/services/score";
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

        // Un joueur connu mais sans aucun jeu vient d'une synchronisation interrompue : la
        // ligne User est écrite avant les jeux, donc un échec en cours de route laisse un
        // profil vide que rien ne viendrait jamais compléter.
        if (!user || user.games.length === 0) {
            await syncUser(username);
            user = await findUserByUsername(username);
        }

        if (!user) {
            return next(new AppError(404, "Joueur PSN introuvable."));
        }

        // Compte les trophées débloqués par le joueur, regroupés par jeu.
        const earnedRows = await prisma.userTrophy.groupBy({
            by: ["gameId"],
            where: { userId: user.psnId },
            _count: { _all: true },
        });
        const earnedByGame = new Map(earnedRows.map((row) => [row.gameId, row._count._all]));

        // Barème : points acquis et maximum atteignable, jeu par jeu
        const scores = await getUserGameScores(user.psnId);
        const scoreByGame = new Map(scores.map((score) => [score.gameId, score]));
        // Les variantes régionales déjà comptées sont exclues du total
        const totalPoints = scores
            .filter((score) => score.counted)
            .reduce((sum, score) => sum + score.earnedPoints, 0);

        res.json({
            psnId: user.psnId,
            username: user.username,
            avatarUrl: user.avatarUrl,
            stats: user.stats,
            totalPoints,
            games: user.games.map((ug) => ({
                gameId: ug.gameId,
                lastUpdatedDateTime: ug.lastUpdatedDateTime,
                earned: earnedByGame.get(ug.gameId) ?? 0,
                total: ug.game._count.trophies,
                earnedPoints: scoreByGame.get(ug.gameId)?.earnedPoints ?? 0,
                maxPoints: scoreByGame.get(ug.gameId)?.maxPoints ?? 0,
                counted: scoreByGame.get(ug.gameId)?.counted ?? true,
                game: {
                    id: ug.game.id,
                    title: ug.game.title,
                    platforms: ug.game.platforms,
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
