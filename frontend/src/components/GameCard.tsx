import { useState } from "react";

type TrophyCounts = {
    bronze: number | null;
    silver: number | null;
    gold: number | null;
    platinum: number | null;
};

type GameCardProps = {
    title: string;
    iconUrl: string | null;
    platforms: string[];
    /** Progression d'un joueur. Absente dans le catalogue, où aucun joueur n'est concerné. */
    earned?: number;
    total?: number;
    /** Trophées définis par le jeu. Affichés à la place de la progression dans le catalogue. */
    trophies?: TrophyCounts;
    /** Barème interne. Absent tant que le jeu n'a pas été noté. */
    difficulty?: number | null;
    points?: number | null;
    /** Progression au barème d'un joueur : acquis sur maximum atteignable. */
    earnedPoints?: number;
    maxPoints?: number;
    /** Faux pour une variante régionale déjà comptée : les points ne s'ajoutent pas. */
    counted?: boolean;
};

export default function GameCard({ title, iconUrl, platforms, earned, total, trophies, difficulty, points, earnedPoints, maxPoints, counted = true }: GameCardProps) {
    const hasProgress = earned !== undefined && total !== undefined;
    const percent = hasProgress && total > 0 ? Math.round((earned / total) * 100) : 0;

    return (
        <div className="group flex items-center gap-4 px-3 py-2 border border-gray-200 transition-colors cursor-pointer hover:brightness-95 bg-white">
            {/* Vignette : fond gris clair, image entière centrée (largeur fixe) */}
            <div className="flex items-center justify-center w-28 shrink-0 self-stretch bg-gray-600">
                {iconUrl && <img src={iconUrl} alt={title} className="w-full h-auto" />}
            </div>

            {/* Titre + progression du joueur, ou nombre de trophées du jeu */}
            <div className="flex-1 min-w-0">
                <p className="text-blue font-bold truncate group-hover:underline" title={title}>
                    {title}
                </p>

                {hasProgress ? (
                    <>
                        <p className="text-gray-500 text-sm mb-1.5">
                            <span className="font-bold">{earned}/{total}</span> trophées
                        </p>
                        {/* Barre de progression, juste sous le nombre de trophées */}
                        <div className="relative h-4 w-48 bg-blue-100">
                            <div
                                className="h-full"
                                style={{
                                    width: `${percent}%`,
                                    background: "linear-gradient(90deg, var(--color-accent), var(--color-blue))",
                                }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-navy-dark">
                                {percent}%
                            </span>
                        </div>
                    </>
                ) : (
                    trophies && <TrophyBreakdown trophies={trophies} />
                )}
            </div>

            {/* Barème à droite : progression du joueur si connue, sinon valeur du jeu */}
            {maxPoints != null && maxPoints > 0 ? (
                <ScoreBadge earned={earnedPoints ?? 0} max={maxPoints} counted={counted} />
            ) : (
                points != null && <PointsBadge points={points} difficulty={difficulty} />
            )}

            {/* Plateformes : un jeu cross-gen en a plusieurs (ex: PS4 + PS5) */}
            {platforms.length > 0 && (
                <div className="flex flex-col items-end -space-y-1.5 shrink-0 self-center">
                    {platforms.map((p) => (
                        <PlatformBadge key={p} platform={p} />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Logo de la plateforme, nommé d'après sa valeur en base : PS4 -> /images/platforms/ps4.png
 *
 * Toutes les plateformes n'ont pas encore de logo. Plutôt que d'afficher une image cassée,
 * on retombe sur l'ancien badge texte tant que le fichier n'existe pas.
 */
function PlatformBadge({ platform }: { platform: string }) {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return (
            <span className="bg-navy-dark text-white text-xs font-bold px-2 py-1">
                {platform}
            </span>
        );
    }

    return (
        <img
            src={`/images/platforms/${platform.toLowerCase()}.png`}
            alt={platform}
            title={platform}
            className="h-6 w-auto object-contain"
            onError={() => setFailed(true)}
        />
    );
}

/** Progression au barème d'un joueur sur un jeu : "30/35 pts". */
function ScoreBadge({ earned, max, counted }: { earned: number; max: number; counted: boolean }) {
    const complete = earned === max;

    // Une variante reste affichée — le joueur l'a bien terminée — mais sans couleur, pour
    // montrer qu'elle ne rapporte rien de plus.
    const style = !counted ? "bg-gray-100 text-gray-400"
        : complete ? "bg-accent text-white"
        : "bg-blue-100 text-navy-dark";

    return (
        <div className="flex flex-col items-end gap-1 shrink-0 self-center">
            <span className={`text-xs font-bold px-2 py-1 rounded ${style}`}>
                {earned}/{max} pts
            </span>
            {!counted && <span className="text-gray-400 text-xs whitespace-nowrap">déjà compté</span>}
        </div>
    );
}

/** Barème interne : points rapportés, et difficulté quand elle est renseignée. */
function PointsBadge({ points, difficulty }: { points: number; difficulty?: number | null }) {
    return (
        <div className="flex flex-col items-end gap-1 shrink-0 self-center">
            <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded">
                {points} pts
            </span>
            {difficulty != null && (
                <span className="text-gray-500 text-xs font-bold whitespace-nowrap" title="Difficulté">
                    Diff. {difficulty}/10
                </span>
            )}
        </div>
    );
}

/** Détail des trophées d'un jeu par couleur, masquant les types absents (ex: pas de platine). */
function TrophyBreakdown({ trophies }: { trophies: TrophyCounts }) {
    const types = [
        { icon: "/icons/platinum.png", label: "platine", count: trophies.platinum },
        { icon: "/icons/gold.png", label: "or", count: trophies.gold },
        { icon: "/icons/silver.png", label: "argent", count: trophies.silver },
        { icon: "/icons/bronze.png", label: "bronze", count: trophies.bronze },
    ].filter((t) => t.count !== null && t.count > 0);

    if (types.length === 0) {
        return <p className="text-gray-400 text-sm">Aucun trophée référencé</p>;
    }

    return (
        <div className="flex items-center gap-3 mt-0.5">
            {types.map(({ icon, label, count }) => (
                <div key={label} className="flex items-center gap-1">
                    <img src={icon} alt={label} className="w-5 h-5 object-contain" />
                    <span className="text-gray-600 text-sm font-bold">{count}</span>
                </div>
            ))}
        </div>
    );
}
