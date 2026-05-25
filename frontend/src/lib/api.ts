const BASE_URL = import.meta.env.API_URL ?? "http://localhost:3010";

async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
    }
    return res.json();
}

export type Game = {
    id: string;
    title: string;
    platform: string | null;
    iconUrl: string | null;
};

export type UserGame = {
    gameId: string;
    lastUpdatedDateTime: string | null;
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
    games: UserGame[];
};

export function fetchProfile(username: string) {
    return get<Profile>(`/api/profile/${username}`);
}
