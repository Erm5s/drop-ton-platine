import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchGame, type GameDetail, type GamePlayer, type Trophy, type TrophyGroup } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const TROPHY_ICONS: Record<Trophy["type"], string> = {
    platinum: "/icons/platinum.png",
    gold: "/icons/gold.png",
    silver: "/icons/silver.png",
    bronze: "/icons/bronze.png",
};

const RARENESS_LABELS: Record<string, string> = {
    ultraRare: "Ultra rare",
    veryRare: "Très rare",
    rare: "Rare",
    common: "Commun",
};

/** Date d'obtention, en français : "12 août 2026 à 21:03". */
function formatEarnedAt(iso: string): string {
    return new Date(iso).toLocaleString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function GamePage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Le joueur du lien prime sur celui connecté : on consulte souvent le profil d'un autre
    const viewedUser = searchParams.get("user") ?? user?.psnUsername ?? undefined;
    const [game, setGame] = useState<GameDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        fetchGame(id, viewedUser)
            .then((result) => {
                if (!cancelled) setGame(result);
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id, viewedUser]);

    if (loading) {
        return <p className="px-6 py-10 text-gray-500 text-sm">Chargement...</p>;
    }

    if (error || !game) {
        return <p className="px-6 py-10 text-red-600 text-sm">{error ?? "Jeu introuvable."}</p>;
    }

    return (
        <div>
            {/* Bandeau d'en-tête pleine largeur, à la manière de la bannière de profil */}
            <div className="relative w-full h-64 overflow-hidden bg-navy-dark">
                {game.iconUrl && (
                    <img
                        src={game.iconUrl}
                        alt={game.title}
                        className="w-full h-full object-cover object-center"
                    />
                )}
                {/* Dégradé sombre en bas, pour que le titre reste lisible sur toute image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <h1 className="absolute bottom-5 left-8 right-8 text-white text-4xl font-bold drop-shadow truncate">
                    {game.title}
                </h1>
            </div>

            <div className="w-full px-6 py-10 bg-white">
            {game.player && <PlayerBanner player={game.player} />}

            {/* Un jeu du catalogue jamais synchronisé n'a aucun trophée en base */}
            {game.groups.length === 0 ? (
                <p className="text-gray-500 text-sm">
                    Les trophées de ce jeu ne sont pas encore enregistrés. Ils le seront à la
                    première synchronisation d'un joueur qui le possède.
                </p>
            ) : (
                game.groups.map((group) => (
                    <TrophyGroupSection key={group.groupId} group={group} game={game} />
                ))
            )}
            </div>
        </div>
    );
}

/**
 * Bandeau de progression du joueur sur ce jeu, pleine largeur.
 *
 * Affiché seulement quand la page connaît le joueur : lien depuis un profil, ou compte
 * connecté avec un PSN lié.
 */
function PlayerBanner({ player }: { player: GamePlayer }) {
    return (
        <div
            className="flex items-center gap-4 px-4 py-3 mb-6 rounded"
            style={{ background: "linear-gradient(360deg, var(--color-navy-dark), var(--color-navy))" }}
        >
            {player.avatarUrl ? (
                <img src={player.avatarUrl} alt={player.username} className="w-14 h-14 object-cover shrink-0" />
            ) : (
                <div className="w-14 h-14 bg-navy shrink-0" />
            )}

            <div className="flex-1 min-w-0">
                <p className="text-white font-bold uppercase tracking-wide truncate">{player.username}</p>
                <p className="text-white text-sm mt-0.5">
                    {player.percent}% - {player.earnedTrophies}/{player.totalTrophies} trophées
                </p>
                <div className="relative h-3 w-56 mt-1.5 bg-white rounded-sm overflow-hidden">
                    <div className="h-full bg-blue" style={{ width: `${player.percent}%` }} />
                </div>
            </div>

            <span className="text-white text-sm italic shrink-0 self-end">
                {player.earnedPoints}/{player.maxPoints} points
            </span>
        </div>
    );
}

/** Compteurs par couleur d'une liste, masquant les types absents (ex: un DLC sans platine). */
function GroupTrophyCounts({ trophies }: { trophies: Trophy[] }) {
    const order: Trophy["type"][] = ["bronze", "silver", "gold", "platinum"];
    const labels: Record<Trophy["type"], string> = {
        bronze: "bronze", silver: "argent", gold: "or", platinum: "platine",
    };

    const counts = order
        .map(type => ({ type, count: trophies.filter(trophy => trophy.type === type).length }))
        .filter(entry => entry.count > 0);

    if (counts.length === 0) {
        return <p className="text-gray-500 text-sm mt-2">Aucun trophée</p>;
    }

    return (
        <div className="flex items-center gap-4 mt-1">
            {counts.map(({ type, count }) => (
                <div key={type} className="flex items-center gap-1.5">
                    <img src={TROPHY_ICONS[type]} alt={labels[type]} title={labels[type]} className="w-5 h-5 object-contain" />
                    <span className="text-sm font-bold text-navy-dark">{count}</span>
                </div>
            ))}
        </div>
    );
}

/**
 * Une liste de trophées : le jeu de base ou un DLC.
 *
 * Chaque liste est coiffée de sa propre carte, avec ses compteurs par couleur et ce qu'elle
 * rapporte : la totalité des points pour la liste de base, la valeur de la difficulté pour un
 * DLC — c'est la règle du barème.
 */
function TrophyGroupSection({ group, game }: { group: TrophyGroup; game: GameDetail }) {
    const worth = group.isBase ? game.points : game.difficulty;

    return (
        <section className="mb-14">
            <div className="max-w-5xl mx-auto flex items-stretch gap-5 mb-4 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
                <div className="w-28 shrink-0 bg-gray-100">
                    {(group.iconUrl ?? game.iconUrl) && (
                        <img
                            src={group.iconUrl ?? game.iconUrl ?? ""}
                            alt={group.name}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                <div className="flex-1 min-w-0 py-2 pr-4 flex flex-col justify-center">
                    <div className="flex items-start gap-4">
                        <h2 className="flex-1 text-lg font-bold text-navy-dark">{group.name}</h2>

                        {/* Les plateformes ne concernent que le jeu : réservées à la liste de base */}
                        {group.isBase && (
                            <div className="flex flex-col items-end -space-y-1.5 shrink-0">
                                {game.platforms.map((platform) => (
                                    <img
                                        key={platform}
                                        src={`/images/platforms/${platform.toLowerCase()}.png`}
                                        alt={platform}
                                        title={platform}
                                        className="h-7 w-auto object-contain"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <GroupTrophyCounts trophies={group.trophies} />

                    {worth != null && (
                        <p className="text-right text-gray-500 text-xs italic mt-1">{worth} points</p>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto flex flex-col gap-1">
                {group.trophies.map((trophy) => (
                    <TrophyRow key={trophy.trophyId} trophy={trophy} />
                ))}
            </div>
        </section>
    );
}

function TrophyRow({ trophy }: { trophy: Trophy }) {
    return (
        <div
            className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors ${
                trophy.earned ? "bg-blue-50 border-blue-100" : "bg-white border-gray-200"
            }`}
        >
            {/* Vignette du trophée, à gauche */}
            {trophy.iconUrl ? (
                <img src={trophy.iconUrl} alt="" className="w-16 h-16 rounded object-cover shrink-0" />
            ) : (
                <div className="w-16 h-16 rounded bg-gray-100 shrink-0" />
            )}

            <div className="flex-1 min-w-0">
                <p className="font-bold text-navy-dark truncate">
                    {trophy.name}
                    {trophy.hidden && (
                        <span className="ml-2 text-xs font-normal text-gray-400">(caché)</span>
                    )}
                </p>
                <p className="text-gray-500 text-sm truncate">{trophy.description}</p>
                {trophy.earned && (
                    <p className="text-blue text-xs italic mt-1">
                        {trophy.earnedAt ? `Obtenu le ${formatEarnedAt(trophy.earnedAt)}` : "Obtenu (date inconnue)"}
                    </p>
                )}
            </div>

            {/* Rareté, puis l'icône de couleur tout à droite */}
            {trophy.earnedRate != null && (
                <div className="text-right shrink-0 hidden sm:block">
                    {/* toFixed(1) : PSN ne donne qu'une décimale, on force le .0 sur les entiers */}
                    <p className="text-sm font-bold text-navy-dark">{trophy.earnedRate.toFixed(1)}%</p>
                    {trophy.rareness && (
                        <p className="text-xs text-gray-500">{RARENESS_LABELS[trophy.rareness]}</p>
                    )}
                </div>
            )}

            <img
                src={TROPHY_ICONS[trophy.type]}
                alt={trophy.type}
                title={trophy.type}
                className="w-10 h-10 object-contain shrink-0"
            />
        </div>
    );
}
