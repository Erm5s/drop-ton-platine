import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/db";
import { AppError } from "@/utils/errors";

const router = Router();

// Nombre de jeux disponible par page
const PAGE_SIZE = 50;

const listQuerySchema = z.object({
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    sort: z.enum(["title", "id"]).default("title"),
    // Case à cocher côté client : seule la valeur "true" active le filtre
    rated: z.enum(["true", "false"]).optional(),
});

// GET /api/games?search=lemmings&page=1&sort=title
router.get("/", async (req, res, next) => {
    try {
        const parsed = listQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return next(new AppError(400, "Paramètres de recherche invalides."));
        }

        const { search, page, sort } = parsed.data;
        const ratedOnly = parsed.data.rated === "true";

        // Une recherche vide ne doit pas filtrer : on liste tout le catalogue
        const where = {
            ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
            ...(ratedOnly ? { points: { not: null } } : {}),
        };

        // Tri par titre : on trie sur sortKey, pas sur title. Cette colonne encode l'ordre
        // voulu (ponctuation, chiffres, alphabet latin, puis écritures étrangères), que la
        // collation de la base ne sait pas produire. L'id départage les titres identiques,
        // sans quoi la pagination par OFFSET pourrait répéter ou sauter un jeu.
        // Tri par id : l'id étant unique, il se suffit à lui-même.
        const orderBy = sort === "id"
            ? [{ id: "asc" as const }]
            : [{ sortKey: "asc" as const }, { id: "asc" as const }];

        // Les deux requêtes partent ensemble : le total sert à calculer le nombre de pages
        const [games, total] = await Promise.all([
            prisma.game.findMany({
                where,
                orderBy,
                skip: (page - 1) * PAGE_SIZE,
                take: PAGE_SIZE,
                select: {
                    id: true,
                    title: true,
                    platforms: true,
                    iconUrl: true,
                    bronze: true,
                    silver: true,
                    gold: true,
                    platinum: true,
                    difficulty: true,
                    points: true,
                },
            }),
            prisma.game.count({ where }),
        ]);

        res.json({
            games,
            total,
            page,
            sort,
            rated: ratedOnly,
            limit: PAGE_SIZE,
            totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        });
    } catch (err) {
        next(err);
    }
});

export default router;
