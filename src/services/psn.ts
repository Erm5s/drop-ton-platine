import {
    exchangeNpssoForAccessCode,
    exchangeAccessCodeForAuthTokens,
    exchangeRefreshTokenForAuthTokens,
    getProfileFromUserName,
    getUserTitles,
    getTitleTrophies,
    getTitleTrophyGroups,
    getUserTrophiesEarnedForTitle,
} from "psn-api";
import { prisma } from "@/db";

type AuthTokensResponse = Awaited<ReturnType<typeof exchangeAccessCodeForAuthTokens>>;

/**
 * Gère l'authentification à l'API PSN.
 *
 * Tente de réutiliser le token en mémoire, puis le refresh token en BDD
 * et en dernier recours s'authentifie via le NPSSO du .env.
 */
export class AuthService {
    private static authToken: AuthTokensResponse | null = null;
    private static expiryTime: number = 0;

    /**
     * Retourne un token d'accès PSN valide.
     *
     * @returns Un token d'accès prêt à l'emploi
     * @throws {Error} Si le NPSSO est absent ou si toutes les tentatives d'authentification échouent
     */
    public static async getAuth(): Promise<AuthTokensResponse> {
        const now = Date.now();

        // CAS 1 : AuthToken en RAM et encore valide
        if (this.authToken && now < this.expiryTime) {
            return this.authToken;
        }

        // CAS 2 : refresh du AuthToken via le Refresh Token (si existant)
        const config = await prisma.systemConfig.findUnique({
            where: { id: 1 },
        });

        if (config?.refreshToken) {
            try {
                console.log("AuthToken expiré, rafraîchissement via Refresh Token");
                const newAuth = await exchangeRefreshTokenForAuthTokens(config.refreshToken);
                await this.saveTokens(newAuth);
                return newAuth;
            } catch {
                console.log("Refresh Token expiré ou invalide");
            }
        }

        // CAS 3 : Utilisation NPSSO (Le code du .env)
        const npsso = process.env.NPSSO;
        if (!npsso) {
            throw new Error("NPSSO manquant dans les variables d'environnement.");
        }

        console.log("Initialisation via NPSSO");
        const accessCode = await exchangeNpssoForAccessCode(npsso);
        const newAuth = await exchangeAccessCodeForAuthTokens(accessCode);
        await this.saveTokens(newAuth);
        return newAuth;
    }

    /**
     * Sauvegarde les tokens en mémoire et le refresh token en BDD.
     * Calcule l'expiration avec une marge de 3 minutes.
     *
     * @param auth La réponse d'authentification retournée par PSN
     * @throws {Error} Si la réponse PSN est invalide ou incomplète
     */
    private static async saveTokens(auth: AuthTokensResponse): Promise<void> {
        if (!auth?.accessToken || !auth?.expiresIn) {
            throw new Error(`Réponse PSN invalide ou incomplète : ${JSON.stringify(auth)}`);
        }

        this.authToken = auth;
        this.expiryTime = Date.now() + ((auth.expiresIn ?? 3600) * 1000) - (3 * 60 * 1000);
        console.log(`Token reçu. Expire dans : ${auth.expiresIn} secondes`);

        await prisma.systemConfig.upsert({
            where: { id: 1 },
            update: { refreshToken: auth.refreshToken },
            create: { id: 1, refreshToken: auth.refreshToken },
        });

        console.log("Tokens mis à jour et sauvegardés.");
    }
}

/**
 * Récupère le profil public d'un joueur PSN.
 *
 * @param username Le pseudo PSN du joueur
 * @returns Le profil PSN complet
 */
export async function fetchProfile(username: string) {
    const tokens = await AuthService.getAuth();
    return getProfileFromUserName(tokens, username);
}

/**
 * Récupère la liste complète des jeux joués par un joueur, toutes pages confondues.
 * PSN renvoie 800 jeux max par appel, on pagine jusqu'à tout avoir.
 *
 * @param accountId L'identifiant du compte PSN du joueur
 * @returns La liste complète des jeux avec progression des trophées
 */
export async function fetchUserGames(accountId: string) {
    const tokens = await AuthService.getAuth();
    const allTitles: Awaited<ReturnType<typeof getUserTitles>>["trophyTitles"] = [];
    let offset: number | undefined = 0;

    while (offset !== undefined) {
        const response = await getUserTitles(tokens, accountId, { limit: 800, offset });
        allTitles.push(...response.trophyTitles);
        offset = response.nextOffset;
    }

    return { trophyTitles: allTitles };
}

/**
 * Récupère tous les trophées définis pour un jeu
 *
 * @param npCommunicationId L'identifiant unique du jeu sur PSN
 * @param platform La plateforme du jeu (`"trophy"` pour PS3/PS4/Vita, `"trophy2"` pour PS5)
 * @returns La liste complète des trophées du jeu
 */
export async function fetchGameTrophies(npCommunicationId: string, platform: string) {
    const tokens = await AuthService.getAuth();
    return getTitleTrophies(tokens, npCommunicationId, "all", { npServiceName: platform as "trophy" | "trophy2" });
}

/**
 * Récupère les trophées débloqués par un joueur sur un jeu donné.
 *
 * @param accountId L'identifiant de compte PSN du joueur
 * @param npCommunicationId L'identifiant unique du jeu sur PSN
 * @param platform La plateforme du jeu (`"trophy"` pour PS3/PS4/Vita, `"trophy2"` pour PS5)
 * @returns La liste des trophées avec statut débloqué/non débloqué et date d'obtention
 */
export async function fetchEarnedTrophies(accountId: string, npCommunicationId: string, platform: string) {
    const tokens = await AuthService.getAuth();
    return getUserTrophiesEarnedForTitle(tokens, accountId, npCommunicationId, "all", { npServiceName: platform as "trophy" | "trophy2" });
}

/**
 * Récupère les groupes de trophées d'un jeu (jeu de base + DLCs).
 *
 * @param npCommunicationId L'identifiant unique du jeu sur PSN
 * @param platform La plateforme du jeu (`"trophy"` pour PS3/PS4/Vita, `"trophy2"` pour PS5)
 * @returns La liste des groupes avec leur nom et icône
 */
export async function fetchTrophyGroups(npCommunicationId: string, platform: string) {
    const tokens = await AuthService.getAuth();
    return getTitleTrophyGroups(tokens, npCommunicationId, { npServiceName: platform as "trophy" | "trophy2" });
}
