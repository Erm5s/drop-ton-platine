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
});

// GET /api/games?search=lemmings&page=1&sort=title
router.get("/", async (req, res, next) => {
    try {
        const parsed = listQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return next(new AppError(400, "Paramètres de recherche invalides."));
        }

        const { search, page, sort } = parsed.data;

        // Une recherche vide ne doit pas filtrer : on liste tout le catalogue
        const where = search ? { title: { contains: search, mode: "insensitive" as const } } : {};

        // Tri par titre : l'id départage les titres identiques (variantes régionales d'un même
        // jeu). Sans ce second critère, l'ordre des ex æquo n'est pas garanti et la pagination
        // par OFFSET peut afficher deux fois le même jeu, ou en sauter un.
        // Tri par id : l'id étant unique, il se suffit à lui-même.
        const orderBy = sort === "id"
            ? [{ id: "asc" as const }]
            : [{ title: "asc" as const }, { id: "asc" as const }];

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
                },
            }),
            prisma.game.count({ where }),
        ]);

        res.json({
            games,
            total,
            page,
            sort,
            limit: PAGE_SIZE,
            totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/games/:id
router.get("/:id", async (req, res, next) => {
    try {
        const game = await prisma.game.findUnique({
            where: { id: req.params.id },
            include: {
                trophyGroups: { orderBy: { groupId: "asc" } },
            },
        });

        if (!game) {
            return next(new AppError(404, "Jeu introuvable."));
        }

        res.json(game);
    } catch (err) {
        next(err);
    }
});

export default router;
