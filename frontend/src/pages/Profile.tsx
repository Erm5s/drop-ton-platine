import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProfile, type Profile } from "@/lib/api";
import GameCard from "@/components/GameCard";

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
        <div>
            {/* Bannière */}
            <div className="w-full overflow-hidden h-78">
                <img
                    src="/images/profile_banner.png"
                    alt="Bannière"
                    className="w-full h-full object-cover object-top"
                />
            </div>

            {/* Enacdré blanche */}
            <div className="relative bg-white shadow-lg px-10 pt-8 pb-20 flex items-center">

                {/* Avatar */}
                <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 -top-2">
                    {profile.avatarUrl ? (
                        <img
                            src={profile.avatarUrl}
                            alt={profile.username}
                            className="w-50 h-50 object-cover border-2 border-white shadow"
                        />
                    ) : (
                        <div className="w-40 h-40 bg-navy border-2 border-white shadow" />
                    )}
                </div>

                {/* Trophées */}
                <div className="flex items-center justify-center gap-6 w-[40%] border border-gray-200 rounded-lg px-6 py-3 shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
                    {stats && (
                        <>
                            <TrophyCount icon="/icons/bronze.png" count={stats.bronze} />
                            <TrophyCount icon="/icons/silver.png" count={stats.silver} />
                            <TrophyCount icon="/icons/gold.png" count={stats.gold} />
                            <TrophyCount icon="/icons/platinum.png" count={stats.platinum} />
                        </>
                    )}
                </div>

                {/* Pseudo */}
                <div className="flex flex-col items-center w-[20%]">
                    <p className="font-bold text-navy-dark text-2xl translate-y-14">{profile.username}</p>
                </div>

                {/* Points et classement */}
                <div className="flex items-center justify-center gap-12 w-[40%] border border-gray-200 rounded-lg px-6 py-3 shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
                    {stats && (
                        <>
                            <span className="text-accent font-semibold italic">
                                Niveau {stats.level}
                            </span>
                            <span className="text-navy-dark font-medium italic">
                                30000 Points
                            </span>
                            <span className="text-navy-dark font-semibold">
                                Classement : 300
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Contenu principal : jeux à gauche, colonne pub à droite */}
            <div className="w-full px-6 py-10 flex gap-6 items-start bg-white">

                {/* Colonne principale */}
                <div className="flex-1 min-w-0 space-y-10">
                    {/* Liste de trophées */}
                    <div>
                        <h2
                            className="text-center text-white text-xl font-semibold py-3 mb-4"
                            style={{ background: "linear-gradient(360deg, var(--color-navy-dark), var(--color-navy))" }}
                        >
                            Liste de trophées
                        </h2>
                        <div className="flex flex-col bg-white">
                            {games.map(({ game, earned, total }) => (
                                <GameCard
                                    key={game.id}
                                    title={game.title}
                                    iconUrl={game.iconUrl}
                                    platform={game.platform}
                                    earned={earned}
                                    total={total}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Colonne publicité (masquée sur petit écran), suit le défilement */}
                <aside className="hidden lg:block w-[250px] shrink-0">
                    <div className="sticky top-4 h-[600px] bg-card border border-border flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">PUB</span>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function TrophyCount({ icon, count }: { icon: string; count: number }) {
    return (
        <div className="flex items-center gap-2">
            <img src={icon} alt="" className="w-8 h-8 object-contain" />
            <span className="font-bold text-navy-dark text-lg">{count}</span>
        </div>
    );
}
