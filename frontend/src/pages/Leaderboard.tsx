import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    fetchLeaderboard,
    fetchStats,
    type Leaderboard,
    type LeaderboardPlayer,
    type RankTier,
    type SiteStats,
} from "@/lib/api";

/**
 * Page « Classement » : les joueurs du site, du plus de points au moins.
 *
 * Les points et le rang sont calculés par le serveur (voir src/services/rank.ts) : cette
 * page ne fait que les mettre en forme.
 */

/** Couleur et médaille d'un rang. Le métal du rang donne les deux. */
const TIERS: Record<RankTier, { color: string; icon: string }> = {
    bronze: { color: "#A3522E", icon: "/icons/bronze.png" },
    argent: { color: "#6E7B8B", icon: "/icons/silver.png" },
    or: { color: "#A98B2E", icon: "/icons/gold.png" },
    platine: { color: "#4AA8DF", icon: "/icons/platinum.png" },
};

/** Nom affiché de chaque métal. */
const TIER_LABELS: Record<RankTier, string> = {
    bronze: "Bronze",
    argent: "Argent",
    or: "Or",
    platine: "Platine",
};

/** Les métaux dans l'ordre croissant, pour le tableau du barème. */
const TIER_ORDER: RankTier[] = ["bronze", "argent", "or", "platine"];

/**
 * Points requis par métal et par palier.
 *
 * Ce barème reprend les paliers du serveur. Les recopier ici évite un appel supplémentaire
 * pour une liste qui ne bouge pas ; en cas de changement, les deux listes sont à reprendre.
 */
const THRESHOLDS: Record<RankTier, Record<Level, number>> = {
    bronze: { 1: 500, 2: 250, 3: 0 },
    argent: { 1: 1600, 2: 1300, 3: 1000 },
    or: { 1: 4000, 2: 3500, 3: 3000 },
    platine: { 1: 8000, 2: 6500, 3: 5000 },
};

type Level = 1 | 2 | 3;

/** Du palier le moins cher au plus cher : les points montent en descendant le tableau. */
const LEVELS: Level[] = [3, 2, 1];

export default function LeaderboardPage() {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Leaderboard | null>(null);
    const [stats, setStats] = useState<SiteStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Les compteurs ne dépendent pas de la page : une seule requête au montage. Un échec
    // est silencieux, la bande disparaît simplement.
    useEffect(() => {
        let cancelled = false;
        fetchStats()
            .then((result) => {
                if (!cancelled) setStats(result);
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        fetchLeaderboard(page)
            .then((result) => {
                if (!cancelled) setData(result);
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
    }, [page]);

    return (
        <div className="bg-white">
            {/* En-tête pleine largeur : le titre seul sur blanc paraissait flotter.
                Le filet accent le détache de la barre de navigation, qui porte le même
                dégradé : collés sans rien entre eux, les deux se confondraient. */}
            <div
                className="w-full px-6 py-10 text-center border-t-4 border-accent"
                style={{ background: "linear-gradient(360deg, var(--color-navy-dark), var(--color-navy))" }}
            >
                <h1 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-wide">
                    Classement
                </h1>

                <span className="block w-24 h-1 bg-accent mx-auto mt-4" />

                {/* Chiffres réels plutôt qu'une accroche : ils remplissent l'en-tête en
                    disant quelque chose d'utile, et ils suivent la base */}
                {stats && <RankDistribution stats={stats} />}

                {/* Les règles n'intéressent pas à chaque visite : repliées par défaut.
                    <details> plutôt qu'un état React, le navigateur sait déjà le faire. */}
                <details className="group max-w-4xl mx-auto mt-5 text-left">
                    <summary className="flex items-center justify-center gap-1.5 cursor-pointer list-none text-accent text-xs font-bold uppercase tracking-wide select-none hover:text-white transition-colors">
                        Comment fonctionne le classement ?
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="w-3 h-3 transition-transform group-open:rotate-180"
                            aria-hidden="true"
                        >
                            <path d="M5 9 L12 16 L19 9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </summary>

                    <div className="mt-5 p-5 bg-white rounded-lg shadow-lg text-sm">
                        <div className="space-y-1.5 text-charcoal text-center">
                            <p>
                                Lorsque vous <strong>platinez</strong> ou <strong>mettez à 100% des jeux</strong> ou{" "}
                                <strong>DLC</strong>, ceux-ci vous <strong>rapportent des points</strong>.
                            </p>
                            <p>
                                Vous pouvez voir combien de points rapporte un jeu directement sur la page de
                                celui-ci.
                            </p>
                            <p>
                                Chaque jeu est <strong>récompensé selon l'investissement qu'il demande</strong> pour
                                être terminé (<strong>difficulté/temps</strong>).
                                Ces points vous permettent de{" "}
                                <strong>gagner des places dans le classement</strong> et d'
                                <strong>obtenir des rangs</strong> spécifiques.
                            </p>
                        </div>

                        <ThresholdTable />
                    </div>
                </details>
            </div>

            <div className="max-w-[92rem] mx-auto px-10 pb-16">
                {data && data.totalPages > 1 && (
                    <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
                )}

                {error && <p className="text-red-600 text-sm py-6 text-center">{error}</p>}

                {loading && !data && <p className="text-gray-500 text-sm py-6 text-center">Chargement...</p>}

                {data && data.players.length === 0 && !error && (
                    <p className="text-gray-500 text-sm py-6 text-center">Aucun joueur classé pour l'instant.</p>
                )}

                {/* La liste garde sa place pendant un chargement, pour éviter que la page saute */}
                <div className={`mt-8 flex flex-col gap-1.5 transition-opacity ${loading ? "opacity-50" : ""}`}>
                    {data?.players.map((player) => (
                        <PlayerRow key={player.psnId} player={player} />
                    ))}
                </div>

                {data && data.totalPages > 1 && (
                    <div className="mt-8">
                        <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
                    </div>
                )}
            </div>
        </div>
    );
}

/** Séparateurs de milliers : les totaux de points se comptent en dizaines de milliers. */
const NUMBER = new Intl.NumberFormat("fr-FR");

/**
 * Répartition des joueurs par métal, sous le titre.
 *
 * Une barre segmentée plutôt qu'une rangée de compteurs : la question qu'on se pose en
 * arrivant sur un classement n'est pas « combien de lignes ? » mais « où est-ce que je me
 * situe ? ». La barre répond d'un coup d'œil, et les couleurs sont déjà celles des rangs.
 */
function RankDistribution({ stats }: { stats: SiteStats }) {
    // Évite une division par zéro sur une base vide, et sert de base aux pourcentages
    const total = Math.max(1, stats.players);

    return (
        <div className="max-w-3xl mx-auto mt-6">
            <p className="text-white/70 text-sm font-bold uppercase tracking-wide">
                <span className="text-white tabular-nums">{NUMBER.format(stats.players)}</span> joueurs suivis
            </p>

            <div className="flex h-2.5 mt-4 rounded-full overflow-hidden bg-white/10">
                {stats.distribution.map(({ tier, count }) => (
                    <span
                        key={tier}
                        className="h-full"
                        style={{ width: `${(count / total) * 100}%`, backgroundColor: TIERS[tier].color }}
                        title={`${count} joueur${count > 1 ? "s" : ""} au rang ${TIER_LABELS[tier]}`}
                    />
                ))}
            </div>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-3">
                {stats.distribution.map(({ tier, count }) => (
                    // Un métal que personne n'a atteint reste visible, en retrait : c'est
                    // une information en soi
                    <span key={tier} className={`flex items-center gap-2 ${count === 0 ? "opacity-40" : ""}`}>
                        <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: TIERS[tier].color }}
                        />
                        <strong className="text-white tabular-nums">{count}</strong>
                        <span className="text-white/70 text-xs font-bold uppercase tracking-wide">
                            {TIER_LABELS[tier]}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}

/**
 * Barème des rangs, en tableau quadrillé : une colonne par métal, une ligne par palier.
 *
 * La matrice se lit plus vite que l'énumération des douze rangs à la suite : on voit d'un
 * coup d'œil ce que coûte le métal suivant.
 */
function ThresholdTable() {
    return (
        <table className="w-full max-w-xl mx-auto mt-6 text-xs border-collapse">
            <thead>
                <tr>
                    <th className="w-20 px-2 py-1.5 border border-gray-300 bg-gray-100 text-center font-bold uppercase tracking-wide text-navy-dark">
                        Palier
                    </th>
                    {TIER_ORDER.map((tier) => (
                        <th
                            key={tier}
                            className="px-2 py-1.5 border border-gray-300 bg-gray-100 text-center font-bold uppercase tracking-wide"
                            style={{ color: TIERS[tier].color }}
                        >
                            {TIER_LABELS[tier]}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {LEVELS.map((level) => (
                    <tr key={level}>
                        <th className="px-2 py-1.5 border border-gray-300 bg-gray-100 text-center font-bold text-navy-dark">
                            {level}
                        </th>
                        {TIER_ORDER.map((tier) => (
                            <td
                                key={tier}
                                className="px-2 py-1.5 border border-gray-300 bg-white text-center tabular-nums text-charcoal"
                            >
                                {THRESHOLDS[tier][level]} pts
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/**
 * Une ligne du classement.
 *
 * Toutes les cellules ont une largeur fixe et chaque nombre occupe une case de taille
 * constante : sans ça, un joueur à 0 trophée décalerait toute sa ligne par rapport aux
 * autres, et « Bronze 3 » ne tomberait pas sous « Platine 1 ». Seul le pseudo s'étire.
 */
function PlayerRow({ player }: { player: LeaderboardPlayer }) {
    const tier = TIERS[player.rank.tier];

    return (
        <Link
            to={`/profile/${encodeURIComponent(player.username)}`}
            className="flex items-center h-14 bg-white border border-gray-100 rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:border-accent transition-colors"
        >
            <span className="w-14 shrink-0 text-center font-bold tabular-nums text-navy-dark">{player.position}</span>

            {player.avatarUrl ? (
                <img src={player.avatarUrl} alt="" className="w-14 h-14 rounded-sm object-cover shrink-0" />
            ) : (
                <div className="w-14 h-14 rounded-sm bg-navy shrink-0" />
            )}

            <span className="flex-1 min-w-0 px-6 font-bold text-navy-dark truncate">{player.username}</span>

            <Divider />

            {/* Rang : la médaille reprend le métal, le libellé sa couleur */}
            {/* Rang : la médaille reprend le métal, le libellé sa couleur */}
            <span className="hidden sm:flex w-48 shrink-0 items-center justify-center gap-3">
                <img src={tier.icon} alt="" className="w-6 h-6 object-contain shrink-0" />
                <em className="whitespace-nowrap" style={{ color: tier.color }}>
                    {player.rank.label}
                </em>
            </span>

            <Divider className="hidden sm:block" />

            <span className="hidden md:flex shrink-0 items-center gap-3 px-8">
                <TrophyCount icon="/icons/bronze.png" label="Bronze" count={player.bronze} />
                <TrophyCount icon="/icons/silver.png" label="Argent" count={player.silver} />
                <TrophyCount icon="/icons/gold.png" label="Or" count={player.gold} />
                <TrophyCount icon="/icons/platinum.png" label="Platine" count={player.platinum} />
                <TotalTrophies count={player.trophies} />
            </span>

            <Divider className="hidden md:block" />

            <span className="w-48 shrink-0 text-center italic tabular-nums text-navy-dark">
                {player.points} Points
            </span>
        </Link>
    );
}

/**
 * Total des trophées, détaché des quatre couleurs par un léger retrait.
 *
 * L'icône est le trophée de bronze repeint en noir (trophy.png) : même coupe, mêmes
 * symboles, mêmes reliefs que les quatre autres, mais sans couleur de métal puisqu'il ne
 * représente aucune des quatre.
 */
function TotalTrophies({ count }: { count: number }) {
    return (
        <span className="flex items-center gap-2 ml-3">
            <img
                src="/icons/trophy.png"
                alt="Total des trophées"
                title="Total des trophées"
                className="w-6 h-6 object-contain shrink-0"
            />
            <span className="w-14 font-bold tabular-nums text-navy-dark">{count}</span>
        </span>
    );
}

/** Filet vertical entre deux cellules. Il ne touche pas les bords, comme sur la maquette. */
function Divider({ className = "" }: { className?: string }) {
    return <span className={`w-px h-8 bg-gray-400 shrink-0 ${className}`} />;
}

function TrophyCount({ icon, label, count }: { icon: string; label: string; count: number }) {
    return (
        <span className="flex items-center gap-2">
            <img src={icon} alt={label} title={label} className="w-6 h-6 object-contain shrink-0" />
            {/* Case de largeur fixe : le compteur suivant ne bouge pas selon le nombre de chiffres */}
            <span className="w-12 font-bold tabular-nums text-navy-dark">{count}</span>
        </span>
    );
}

/**
 * Pagination en chevrons : « ‹ 1 2 3 4 … 217 › ».
 *
 * La fenêtre suit la page courante, et la dernière page reste toujours atteignable d'un
 * clic : sur 217 pages, revenir à la fin ne doit pas demander de cliquer 200 fois.
 */
function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
    const start = Math.max(1, Math.min(page - 1, totalPages - 3));
    const end = Math.min(totalPages, start + 3);
    const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

    return (
        <div className="flex items-center justify-center gap-3 text-lg">
            <Chevron
                direction="left"
                disabled={page === 1}
                label="Page précédente"
                onClick={() => onChange(page - 1)}
            />

            {start > 1 && (
                <>
                    <PageNumber page={1} current={page} onChange={onChange} />
                    <span className="text-navy-dark">…</span>
                </>
            )}

            {pages.map((p) => (
                <PageNumber key={p} page={p} current={page} onChange={onChange} />
            ))}

            {end < totalPages && (
                <>
                    <span className="text-navy-dark">…</span>
                    <PageNumber page={totalPages} current={page} onChange={onChange} />
                </>
            )}

            <Chevron
                direction="right"
                disabled={page === totalPages}
                label="Page suivante"
                onClick={() => onChange(page + 1)}
            />
        </div>
    );
}

function PageNumber({ page, current, onChange }: { page: number; current: number; onChange: (p: number) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(page)}
            aria-current={page === current ? "page" : undefined}
            className={`cursor-pointer transition-colors ${
                page === current ? "text-accent font-bold" : "text-navy-dark hover:text-accent"
            }`}
        >
            {page}
        </button>
    );
}

function Chevron({
    direction,
    disabled,
    label,
    onClick,
}: {
    direction: "left" | "right";
    disabled: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            aria-label={label}
            className="text-navy-dark transition-opacity hover:opacity-60 disabled:opacity-25 disabled:cursor-not-allowed"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                <path
                    d={direction === "left" ? "M15 5 L8 12 L15 19" : "M9 5 L16 12 L9 19"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
}
