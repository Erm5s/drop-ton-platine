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
                include: { game: true },
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

        res.json(user);
    } catch (err) {
        if (err instanceof Error && err.message.includes("User not found")) {
            return next(new AppError(404, "Joueur PSN inexistant."));
        }
        next(err);
    }
});

export default router;
