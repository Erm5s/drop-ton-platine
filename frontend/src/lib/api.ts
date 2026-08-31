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
    platform: string | null;
    iconUrl: string | null;
};

export type UserGame = {
    gameId: string;
    lastUpdatedDateTime: string | null;
    earned: number;
    total: number;
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

