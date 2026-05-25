import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProfile, type Profile } from "@/lib/api";

export default function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!username) return;
        fetchProfile(username)
            .then(setProfile)
            .catch((err: Error) => setError(err.message));
    }, [username]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Chargement...</p>
            </div>
        );
    }

    const { stats, games } = profile;

    return (
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

            {/* En-tête profil */}
            <div className="flex items-center gap-6">
                {profile.avatarUrl && (
                    <img
                        src={profile.avatarUrl}
                        alt={profile.username}
                        className="w-24 h-24 rounded-full border-2 border-accent"
                    />
                )}
                <div>
                    <h1 className="text-3xl font-bold">{profile.username}</h1>
                    {stats && (
                        <p className="text-muted-foreground mt-1">
                            Niveau {stats.level} · {stats.progress}%
                        </p>
                    )}
                </div>
            </div>

            {/* Stats trophées */}
            {stats && (
                <div className="grid grid-cols-4 gap-4">
                    <StatCard label="Platine" count={stats.platinum} color="text-blue-200" />
                    <StatCard label="Or" count={stats.gold} color="text-yellow-300" />
                    <StatCard label="Argent" count={stats.silver} color="text-slate-300" />
                    <StatCard label="Bronze" count={stats.bronze} color="text-orange-400" />
                </div>
            )}

            {/* Liste des jeux */}
            <div>
                <h2 className="text-xl font-semibold mb-4">
                    Jeux ({games.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {games.map(({ game, lastUpdatedDateTime }) => (
                        <div key={game.id} className="bg-card rounded-lg overflow-hidden">
                            {game.iconUrl ? (
                                <img
                                    src={game.iconUrl}
                                    alt={game.title}
                                    className="w-full aspect-square object-cover"
                                />
                            ) : (
                                <div className="w-full aspect-square bg-navy flex items-center justify-center">
                                    <span className="text-muted-foreground text-xs text-center px-2">{game.title}</span>
                                </div>
                            )}
                            <div className="p-2">
                                <p className="text-sm font-medium truncate" title={game.title}>
                                    {game.title}
                                </p>
                                <p className="text-xs text-muted-foreground">{game.platform}</p>
                                {lastUpdatedDateTime && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(lastUpdatedDateTime).toLocaleDateString("fr-FR")}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div className="bg-card rounded-lg p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
    );
}
