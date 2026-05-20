import { Router } from "express";

const router = Router();

// GET /api/profile/:username
router.get("/:username", async (_req, res, next) => {
    try {
        // TODO: get les infos du profil
        res.json({ message: "profile route ok" });
    } catch (err) {
        next(err);
    }
});

export default router;
