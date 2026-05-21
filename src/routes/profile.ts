import { Router } from "express";
import { syncUser } from "@/services/sync";
import { AppError } from "@/utils/errors";

const router = Router();

// GET /api/profile/:username
router.get("/:username", async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await syncUser(username);
        res.json(user);
    } catch (err) {
        if (err instanceof Error && err.message.includes("User not found")) {
            return next(new AppError(404, "Joueur PSN inexistant."));
        }
        next(err);
    }
});

export default router;
