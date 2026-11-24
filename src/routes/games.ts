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

// GET /api/games/:id?user=<pseudo PSN> — fiche complète, trophées regroupés par liste.
// Le paramètre user est facultatif : sans lui, aucun trophée n'est marqué comme obtenu.
router.get("/:id", async (req, res, next) => {
    try {
        const requestedUser = typeof req.query.user === "string" ? req.query.user.trim() : "";

        const game = await prisma.game.findUnique({
            where: { id: req.params.id },
            include: {
                // Trié plus bas : "default" doit passer en tête, or en ordre alphabétique
                // "001" le précède.
                trophyGroups: {
                    orderBy: { groupId: "asc" },
                    include: {
                        trophies: {
                            orderBy: { trophyId: "asc" },
                            select: {
                                trophyId: true,
                                name: true,
                                description: true,
                                type: true,
                                rareness: true,
                                earnedRate: true,
                                hidden: true,
                                iconUrl: true,
                            },
                        },
                    },
                },
            },
        });

        if (!game) {
            return next(new AppError(404, "Jeu introuvable."));
        }

        // Dates d'obtention du joueur demandé. Le pseudo PSN est insensible à la casse, et on
        // accepte aussi l'identifiant PSN pour que la page marche depuis n'importe quel lien.
        const earnedAtByTrophy = new Map<number, Date | null>();
        let player: { username: string; avatarUrl: string | null } | null = null;

        if (requestedUser !== "") {
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { psnId: requestedUser },
                        { username: { equals: requestedUser, mode: "insensitive" } },
                    ],
                },
                select: { psnId: true, username: true, avatarUrl: true },
            });

            if (user) {
                player = { username: user.username, avatarUrl: user.avatarUrl };

                const earned = await prisma.userTrophy.findMany({
                    where: { userId: user.psnId, gameId: game.id },
                    select: { trophyId: true, earnedAt: true },
                });

                for (const row of earned) {
                    earnedAtByTrophy.set(row.trophyId, row.earnedAt);
                }
            }
        }

        // Progression du joueur sur ce jeu, calculée depuis les listes déjà chargées :
        // aucune requête supplémentaire n'est nécessaire.
        const groups = [...game.trophyGroups].sort((a, b) =>
            a.groupId === "default" ? -1
            : b.groupId === "default" ? 1
            : a.groupId.localeCompare(b.groupId));

        const isComplete = (group: (typeof groups)[number]) =>
            group.trophies.length > 0 && group.trophies.every(t => earnedAtByTrophy.has(t.trophyId));

        const dlcGroups = groups.filter(group => group.groupId !== "default");
        const baseCompleted = groups.some(group => group.groupId === "default" && isComplete(group));
        const dlcCompleted = dlcGroups.filter(isComplete).length;

        const totalTrophies = groups.reduce((sum, group) => sum + group.trophies.length, 0);
        const earnedTrophies = earnedAtByTrophy.size;

        res.json({
            id: game.id,
            title: game.title,
            platforms: game.platforms,
            iconUrl: game.iconUrl,
            description: game.description,
            difficulty: game.difficulty,
            points: game.points,
            bronze: game.bronze,
            silver: game.silver,
            gold: game.gold,
            platinum: game.platinum,
            // Null quand aucun joueur n'est précisé : la page masque alors le bandeau
            player: player && {
                ...player,
                earnedTrophies,
                totalTrophies,
                percent: totalTrophies > 0 ? Math.round((earnedTrophies / totalTrophies) * 100) : 0,
                earnedPoints:
                    (baseCompleted ? game.points ?? 0 : 0) + dlcCompleted * (game.difficulty ?? 0),
                maxPoints: (game.points ?? 0) + dlcGroups.length * (game.difficulty ?? 0),
            },
            // La liste de base d'abord, puis les DLC dans leur ordre de numérotation
            groups: groups
                .map(group => ({
                    groupId: group.groupId,
                    name: group.name,
                    iconUrl: group.iconUrl,
                    isBase: group.groupId === "default",
                    trophies: group.trophies.map(trophy => ({
                        ...trophy,
                        // Présent dans la table = obtenu, même si la date manque (vieux titres PS3)
                        earned: earnedAtByTrophy.has(trophy.trophyId),
                        earnedAt: earnedAtByTrophy.get(trophy.trophyId) ?? null,
                    })),
                })),
        });
    } catch (err) {
        next(err);
    }
});

export default router;
