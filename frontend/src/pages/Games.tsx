import { useEffect, useState } from "react";
import { fetchGames, type GameList, type GameSort } from "@/lib/api";
import GameCard from "@/components/GameCard";

const SORT_OPTIONS: { value: GameSort; label: string }[] = [
    { value: "title", label: "Ordre alphabétique" },
    { value: "id", label: "Identifiant PSN" },
];

export default function GamesPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<GameSort>("title");

    const [data, setData] = useState<GameList | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Anti-rebond : on attend une pause dans la frappe avant d'interroger le serveur,
    // sinon chaque lettre déclenche une requête.
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Toute nouvelle recherche ou changement de tri renvoie en page 1
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, sort]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        fetchGames({ search: debouncedSearch, page, sort })
            .then((result) => {
                // Une réponse arrivée après un changement de recherche est périmée : on l'ignore
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
    }, [debouncedSearch, page, sort]);

    return (
        <div className="w-full px-6 py-10 bg-white">
            <h2
                className="text-center text-white text-xl font-semibold py-3 mb-4"
                style={{ background: "linear-gradient(360deg, var(--color-navy-dark), var(--color-navy))" }}
            >
                Catalogue des jeux
            </h2>

            {/* Barre de recherche + critère de tri */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un jeu..."
                    className="flex-1 min-w-60 bg-card border border-border rounded-lg px-4 py-2 text-sm outline-none focus:border-accent transition-colors"
                />
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as GameSort)}
                    aria-label="Trier par"
                    className="bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                >
                    {SORT_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>
                            Trier : {label}
                        </option>
                    ))}
                </select>
            </div>

            {data && !error && (
                <p className="text-gray-500 text-sm mb-3">
                    {data.total === 0
                        ? "Aucun jeu trouvé"
                        : `${data.total} jeu${data.total > 1 ? "x" : ""} — page ${data.page} sur ${data.totalPages}`}
                </p>
            )}

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            {/* La liste garde sa place pendant un chargement, pour éviter que la page saute */}
            <div className={`flex flex-col bg-white transition-opacity ${loading ? "opacity-50" : ""}`}>
                {data?.games.map((game) => (
                    <GameCard
                        key={game.id}
                        title={game.title}
                        iconUrl={game.iconUrl}
                        platforms={game.platforms}
                        trophies={game}
                    />
                ))}
            </div>

            {loading && !data && <p className="text-gray-500 text-sm py-6">Chargement...</p>}

            {data && data.totalPages > 1 && (
                <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
            )}
        </div>
    );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
    // Fenêtre glissante de 5 pages centrée sur la page courante, bornée aux extrémités
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <PageButton disabled={page === 1} onClick={() => onChange(page - 1)}>
                Précédent
            </PageButton>

            {start > 1 && <span className="text-gray-400 px-1">...</span>}

            {pages.map((p) => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    className={`px-3 py-1.5 text-sm font-bold border transition-colors ${
                        p === page
                            ? "bg-navy-dark text-white border-navy-dark"
                            : "bg-white text-navy-dark border-gray-200 hover:brightness-95"
                    }`}
                >
                    {p}
                </button>
            ))}

            {end < totalPages && <span className="text-gray-400 px-1">...</span>}

            <PageButton disabled={page === totalPages} onClick={() => onChange(page + 1)}>
                Suivant
            </PageButton>
        </div>
    );
}

function PageButton({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className="px-3 py-1.5 text-sm font-bold border border-gray-200 bg-white text-navy-dark transition-colors hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
        >
            {children}
        </button>
    );
}
