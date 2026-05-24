import { prisma } from "@/db";
import { fetchProfile, fetchUserGames, fetchTrophyGroups, fetchGameTrophies, fetchEarnedTrophies } from "@/services/psn";

// L'API utilise "trophy2" pour les jeux PS5 et "trophy" pour toutes les autres platformes
function getPlatform(trophyTitlePlatform: string): "trophy" | "trophy2" {
    return trophyTitlePlatform.includes("PS5") ? "trophy2" : "trophy";
}

/**
 * Synchronise le profil, les stats, et tous les jeux/trophées d'un joueur PSN.
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
        const platform = getPlatform(title.trophyTitlePlatform);

        // Recherche d'un jeu d'un joueur dans la DB
        const userGame = await prisma.userGame.findUnique({
            where: { userId_gameId: { userId: accountId, gameId } },
        });

        // Si le jeu n'a pas changé depuis la dernière sychronisation, ça passe au jeu suivant
        if (userGame?.lastUpdatedDateTime?.getTime() === lastUpdated.getTime()) {
            continue;
        }

        // Vérification si la liste des trophées nécessite une mise à jour
        await syncGame(gameId, title.trophyTitleName, title.trophyTitlePlatform, title.trophyTitleIconUrl, title.trophySetVersion, platform);

        // On enregistre les trophées obtenus par le joueur sur ce jeu
        const { trophies: earnedTrophies } = await fetchEarnedTrophies(accountId, gameId, platform);
        const earned = earnedTrophies.filter(t => t.earned);

        await prisma.userTrophy.createMany({
            data: earned.map(t => ({
                userId: accountId,
                trophyId: `${gameId}-${t.trophyId}`,
                ...(t.earnedDateTime ? { earnedAt: new Date(t.earnedDateTime) } : {}),
            })),
            skipDuplicates: true,
        });

        // On met à jour la date de dernière sync pour ce jeu
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
 * @param platform La plateforme (PSVITA/PS3/PS5/PS5/PC)
 * @param iconUrl L'URL de l'icône du jeu
 * @param trophySetVersion La version de la liste de trophées
 * @param npServiceName La plateforme pour l'API ("trophy" ou "trophy2")
 */
async function syncGame(gameId: string, title: string, platform: string, iconUrl: string, trophySetVersion: string, npServiceName: "trophy" | "trophy2") {
   // Récupération du jeu à synchroniser
    const existing = await prisma.game.findUnique({ where: { id: gameId } });

    // Nécessite une sychronisation avec la DB si le jeu n'est pas déjà dedans ou si la version n'est pas à jour
    const needsTrophySync = !existing || existing.trophySetVersion !== trophySetVersion;

    // Si le jeu n'existe pas dans la DB, on l'enregistre
    if (!existing) {
        await prisma.game.create({
            data: { id: gameId, title, platform, iconUrl, trophySetVersion },
        });
    // Sinon, si le jeu existe et que la liste de trophées à une nouvelle version, on le met à jour
    } else if (existing.trophySetVersion !== trophySetVersion) {
        await prisma.game.update({
            where: { id: gameId },
            data: { title, platform, iconUrl, trophySetVersion },
        });
    }

    if (needsTrophySync) {
        // Sychronisation des données des listes (jeu de base et DLC)
        const { trophyGroups } = await fetchTrophyGroups(gameId, npServiceName);
        for (const g of trophyGroups) {
            const groupId = `${gameId}-${g.trophyGroupId}`;
            await prisma.trophyGroup.upsert({
                where: { id: groupId },
                update: { name: g.trophyGroupName, iconUrl: g.trophyGroupIconUrl ?? null },
                create: { id: groupId, gameId, groupId: g.trophyGroupId, name: g.trophyGroupName, iconUrl: g.trophyGroupIconUrl ?? null },
            });
        }

        // Sychronisation des données des trophées individuelles
        const { trophies } = await fetchGameTrophies(gameId, npServiceName);
        for (const t of trophies) {
            const trophyId = `${gameId}-${t.trophyId}`;
            const trophyData = {
                gameId,
                trophyGroupId: `${gameId}-${t.trophyGroupId ?? "default"}`,
                name: t.trophyName ?? "",
                description: t.trophyDetail ?? null,
                rarity: t.trophyType,
                iconUrl: t.trophyIconUrl ?? null,
            };
            await prisma.trophy.upsert({
                where: { id: trophyId },
                update: trophyData,
                create: { id: trophyId, ...trophyData },
            });
        }
    }
}
