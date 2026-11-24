import { prisma } from "@/db";
import { fetchProfile, fetchUserGames, fetchTrophyGroups, fetchGameTrophies, fetchEarnedTrophies } from "@/services/psn";
import { buildGameSortKey, formatTrophyTitleName } from "@/utils/trophyTitleName";

// L'API utilise "trophy2" pour les jeux PS5 et "trophy" pour toutes les autres platformes
function getPlatform(trophyTitlePlatform: string): "trophy" | "trophy2" {
    return trophyTitlePlatform.includes("PS5") ? "trophy2" : "trophy";
}

// Normalisation des noms de platforme 
const PLATFORM_ALIAS: Record<string, string> = { VITA: "PSVITA", PC: "PSPC" };

// L'API renvoie les noms des platfromes sous forme de string séparé par des virgules
export function parsePlatforms(trophyTitlePlatform: string): string[] {
    return trophyTitlePlatform
        .split(",")
        .map(p => p.trim().toUpperCase())
        .filter(Boolean)
        .map(p => PLATFORM_ALIAS[p] ?? p);
}

// L'API renvoie la rareté sous forme d'entier 
// (UltraRare = 0, VeryRare =  1, Rare = 2, Common = 3)
const RARENESS = ["ultraRare", "veryRare", "rare", "common"] as const;

function getRareness(trophyRare: number | undefined) {
    return trophyRare === undefined ? null : RARENESS[trophyRare] ?? null;
}

/**
 * Synchronise le profil, les stats, et tous les jeux et trophées d'un joueur PSN.
 *
 * @param username Le pseudo PSN du joueur
 * @returns L'utilisateur en base de données
 */
export async function syncUser(username: string) {
    const profile = await fetchProfile(username);

    const accountId = profile.profile.accountId;
    const trophySummary = profile.profile.trophySummary;

    const userInfo = {
        username: profile.profile.onlineId,
        avatarUrl: profile.profile.avatarUrls?.[0]?.avatarUrl ?? null,
    };

    const user = await prisma.user.upsert({
        where: { psnId: accountId },
        update: userInfo,
        create: { psnId: accountId, ...userInfo },
    });

    const userStats = {
        level: trophySummary.level,
        progress: trophySummary.progress,
        bronze: trophySummary.earnedTrophies.bronze,
        silver: trophySummary.earnedTrophies.silver,
        gold: trophySummary.earnedTrophies.gold,
        platinum: trophySummary.earnedTrophies.platinum,
    };

    await prisma.userStats.upsert({
        where: { psnId: accountId },
        update: userStats,
        create: { psnId: accountId, ...userStats },
    });

    await syncUserGames(accountId);

    return user;
}

/**
 * Synchronise la liste des jeux et les trophées obtenus d'un joueur.
 * Saute les jeux déjà à jour grâce à lastUpdatedDateTime.
 * Si le jeu n'est pas enregistré ou pas à jour dans la DB, l'enregistre ou le met à jour.
 *
 * @param accountId L'identifiant PSN du joueur
 */
async function syncUserGames(accountId: string) {
    const { trophyTitles } = await fetchUserGames(accountId);

    for (const title of trophyTitles) {
        const gameId = title.npCommunicationId;
        const lastUpdated = new Date(title.lastUpdatedDateTime);
        const npServiceName = getPlatform(title.trophyTitlePlatform);

        // Recherche d'un jeu d'un joueur dans la DB
        const userGame = await prisma.userGame.findUnique({
            where: { userId_gameId: { userId: accountId, gameId } },
        });

        // Si le jeu n'a pas changé depuis la dernière sychronisation, ça passe au jeu suivant
        if (userGame?.lastUpdatedDateTime?.getTime() === lastUpdated.getTime()) {
            continue;
        }

        // Vérification si la liste des trophées nécessite une mise à jour
        const trophySetSynced = await syncGame(gameId, formatTrophyTitleName(title.trophyTitleName), parsePlatforms(title.trophyTitlePlatform), title.trophyTitleIconUrl, title.trophySetVersion, npServiceName);

        // On enregistre les trophées obtenus par le joueur sur ce jeu
        const { trophies: earnedTrophies } = await fetchEarnedTrophies(accountId, gameId, npServiceName);
        const earned = earnedTrophies.filter(t => t.earned);

        // Enregistrement de la rareté des trophées si la listé nécessite une mise à jour
        if (trophySetSynced) {
            for (const t of earnedTrophies) {
                await prisma.trophy.updateMany({
                    where: { gameId, trophyId: t.trophyId },
                    data: {
                        rareness: getRareness(t.trophyRare),
                        earnedRate: t.trophyEarnedRate ? Number(t.trophyEarnedRate) : null,
                    },
                });
            }
        }

        // Mise à jour des trophées obtenus pour ce jeu
        await prisma.userTrophy.createMany({
            data: earned.map(t => ({
                userId: accountId,
                gameId,
                trophyId: t.trophyId,
                ...(t.earnedDateTime ? { earnedAt: new Date(t.earnedDateTime) } : {}),
            })),
            skipDuplicates: true,
        });

        // Enregistement de la date de dernière sync pour ce jeu
        await prisma.userGame.upsert({
            where: { userId_gameId: { userId: accountId, gameId } },
            update: { lastUpdatedDateTime: lastUpdated },
            create: { userId: accountId, gameId, lastUpdatedDateTime: lastUpdated },
        });
    }
}

/**
 * Crée ou met à jour un jeu et ses trophées en BDD.
 * Si le jeu est déjà connu, on ne re-fetch pas ses trophées depuis PSN.
 *
 * @param gameId L'identifiant unique du jeu (npCommunicationId)
 * @param title Le nom du jeu
 * @param platforms Les plateformes du jeu, déjà découpées (ex: ["PS4", "PS5"])
 * @param iconUrl L'URL de l'icône du jeu
 * @param trophySetVersion La version de la liste de trophées
 * @param npServiceName La plateforme pour l'API ("trophy" ou "trophy2")
 * @returns true si la liste de trophées vient d'être (re)construite
 */
async function syncGame(gameId: string, title: string, platforms: string[], iconUrl: string, trophySetVersion: string, npServiceName: "trophy" | "trophy2") {
    // Récupération du jeu à synchroniser, avec le nombre de trophées déjà en base
    const existing = await prisma.game.findUnique({
        where: { id: gameId },
        include: { _count: { select: { trophies: true } } },
    });

    // Nécessite une synchronisation si le jeu n'est pas déjà en base, si la version n'est pas
    // à jour, ou si aucun trophée n'est enregistré. Ce dernier cas vient d'un jeu inscrit au
    // catalogue avec ses métadonnées et sa version, mais sans ses trophées : la version
    // ferait alors croire à tort que la liste est déjà synchronisée.
    const needsTrophySync = !existing
        || existing.trophySetVersion !== trophySetVersion
        || existing._count.trophies === 0;

    // Ajout du jeu dans la base s'il n'existe pas, sinon rafraîchissement de ses infos
    // (le titre et l'icône peuvent changer côté PSN sans que la liste de trophées bouge)
    await prisma.game.upsert({
        where: { id: gameId },
        create: { id: gameId, title, sortKey: buildGameSortKey(title), platforms, iconUrl },
        update: { title, sortKey: buildGameSortKey(title), platforms, iconUrl },
    });

    if (needsTrophySync) {
        // Sychronisation des données des listes (jeu de base et DLC)
        const { trophyGroups } = await fetchTrophyGroups(gameId, npServiceName);
        for (const g of trophyGroups) {
            const groupData = { name: g.trophyGroupName, iconUrl: g.trophyGroupIconUrl ?? null };
            await prisma.trophyGroup.upsert({
                where: { gameId_groupId: { gameId, groupId: g.trophyGroupId } },
                update: groupData,
                create: { gameId, groupId: g.trophyGroupId, ...groupData },
            });
        }

        // Sychronisation des données des trophées individuelles
        const { trophies } = await fetchGameTrophies(gameId, npServiceName);
        for (const t of trophies) {
            const trophyData = {
                groupId: t.trophyGroupId ?? "default",
                name: t.trophyName ?? "",
                description: t.trophyDetail ?? null,
                type: t.trophyType,
                hidden: t.trophyHidden,
                iconUrl: t.trophyIconUrl ?? null,
            };
            await prisma.trophy.upsert({
                where: { gameId_trophyId: { gameId, trophyId: t.trophyId } },
                update: trophyData,
                create: { gameId, trophyId: t.trophyId, ...trophyData },
            });
        }

        // Marque la liste comme synchronisée.
        await prisma.game.update({
            where: { id: gameId },
            data: { trophySetVersion },
        });
    }

    return needsTrophySync;
}
