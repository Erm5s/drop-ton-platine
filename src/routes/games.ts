import { Router } from "express";

const router = Router();

// GET /api/games/:id
router.get("/:id", async (_req, res, next) => {
    try {
        // TODO: get les infos d'un jeu
        res.json({ message: "games route ok" });
    } catch (err) {
        next(err);
    }
});

export default router;
