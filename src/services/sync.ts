import { prisma } from "@/db";
import { fetchProfile } from "@/services/psn";

/**
 * Récupère le profil PSN d'un joueur et le synchronise en base de données.
 * Si le joueur existe déjà, met à jour ses infos. Sinon, le crée.
 *
 * @param username Le pseudo PSN du joueur
 * @returns L'utilisateur avec ses stats en base de données
 */
export async function syncUser(username: string) {
    // Appel à l'API PSN pour récupérer le profil complet du joueur
    const profile = await fetchProfile(username);

    const accountId = profile.profile.accountId;
    const trophySummary = profile.profile.trophySummary;

    // Upsert des informations principales du joueur
    const userInfo = {
        username: profile.profile.onlineId,
        avatarUrl: profile.profile.avatarUrls?.[0]?.avatarUrl ?? null,
    };

    const user = await prisma.user.upsert({
        where: { psnId: accountId },
        update: userInfo,
        create: { psnId: accountId, ...userInfo },
    });

    // Upsert des statistiques des trophées globales
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

    // TODO: synchronisation des jeux et des trophées
    return user;
}