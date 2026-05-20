import { Router } from "express";

const router = Router();

// GET /api/trophies/:gameId
router.get("/:gameId", async (_req, res, next) => {
    try {
        // TODO: get tous les trophées pour un jeu en question
        res.json({ message: "trophies route ok" });
    } catch (err) {
        next(err);
    }
});

export default router;
