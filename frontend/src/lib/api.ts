const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3010";

async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "GET",
        credentials: "include",
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
    }
    return res.json();
}

async function post<T = unknown>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Erreur ${res.status}`);
    }
    return res.json();
}


export type Game = {
    id: string;
    title: string;
    platforms: string[];
    iconUrl: string | null;
};

/** Jeu du catalogue : porte le nombre de trophées définis, sans progression d'un joueur. */
export type CatalogGame = Game & {
    bronze: number | null;
    silver: number | null;
    gold: number | null;
    platinum: number | null;
    difficulty: number | null;
    points: number | null;
};

export type GameSort = "title" | "id";

export type GameList = {
    games: CatalogGame[];
    total: number;
    page: number;
    sort: GameSort;
    rated: boolean;
    limit: number;
    totalPages: number;
};

export type Trophy = {
    trophyId: number;
    name: string;
    description: string | null;
    type: "bronze" | "silver" | "gold" | "platinum";
    rareness: "ultraRare" | "veryRare" | "rare" | "common" | null;
    earnedRate: number | null;
    hidden: boolean;
    iconUrl: string | null;
    /** Obtenu par le joueur demandé. Toujours faux si aucun joueur n'est précisé. */
    earned: boolean;
    /** Date d'obtention. Peut être nulle sur un trophée obtenu, PSN ne la fournissant pas toujours. */
    earnedAt: string | null;
};

export type TrophyGroup = {
    groupId: string;
    name: string;
    iconUrl: string | null;
    /** Vrai pour la liste de base, faux pour un DLC. */
    isBase: boolean;
    trophies: Trophy[];
};

/** Progression d'un joueur sur un jeu précis. Null si aucun joueur n'est demandé. */
export type GamePlayer = {
    username: string;
    avatarUrl: string | null;
    earnedTrophies: number;
    totalTrophies: number;
    percent: number;
    earnedPoints: number;
    maxPoints: number;
};

export type GameDetail = CatalogGame & {
    description: string | null;
    player: GamePlayer | null;
    groups: TrophyGroup[];
};

export function fetchGame(id: string, user?: string) {
    const params = user ? `?user=${encodeURIComponent(user)}` : "";
    return get<GameDetail>(`/api/games/${id}${params}`);
}

export type UserGame = {
    gameId: string;
    lastUpdatedDateTime: string | null;
    earned: number;
    total: number;
    /** Points acquis sur ce jeu selon le barème. */
    earnedPoints: number;
    /** Points maximum atteignables : liste de base + un lot par DLC. */
    maxPoints: number;
    /** Faux si ce jeu est une variante régionale déjà comptée ailleurs. */
    counted: boolean;
    game: Game;
};

export type UserStats = {
    level: number;
    progress: number;
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
};

export type Profile = {
    psnId: string;
    username: string;
    avatarUrl: string | null;
    stats: UserStats | null;
    /** Somme des points acquis sur tous les jeux. */
    totalPoints: number;
    games: UserGame[];
};

export function fetchProfile(username: string) {
    return get<Profile>(`/api/profile/${username}`);
}

export function fetchGames({ search, page, sort, rated }: { search?: string; page?: number; sort?: GameSort; rated?: boolean }) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (page) params.set("page", String(page));
    if (sort) params.set("sort", sort);
    if (rated) params.set("rated", "true");

    return get<GameList>(`/api/games?${params}`);
}

export async function register(email: string, password: string) {
    return post("/api/auth/register", { email, password });
}

export async function login(login: string, password: string) {
    return post("/api/auth/login", { login, password });
}

export async function logout() {
    return post("/api/auth/logout", {});
}

export async function getMe() {
    return get<{ id: string; username: string; psnId: string | null; psnUsername: string | null }>("/api/auth/me");
}

export async function startPsnLink() {
    return post<{ code: string }>("/api/auth/psn/link-start", {});
}

export async function verifyPsnLink(psnUsername: string) {
    return post("/api/auth/psn/link-verify", { psnUsername });
}


