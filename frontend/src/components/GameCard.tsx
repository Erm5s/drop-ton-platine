type GameCardProps = {
    title: string;
    iconUrl: string | null;
    platforms: string[];
    earned: number;
    total: number;
};

export default function GameCard({ title, iconUrl, platforms, earned, total }: GameCardProps) {
    const percent = total > 0 ? Math.round((earned / total) * 100) : 0;
    
    return (
        <div className="group flex items-center gap-4 px-3 py-2 border border-gray-200 transition-colors cursor-pointer hover:brightness-95 bg-white">
            {/* Vignette : fond gris clair, image entière centrée (largeur fixe) */}
            <div className="flex items-center justify-center w-28 shrink-0 self-stretch bg-gray-100">
                {iconUrl && <img src={iconUrl} alt={title} className="w-full h-auto" />}
            </div>

            {/* Titre + trophées + barre de progression */}
            <div className="flex-1 min-w-0">
                <p className="text-blue font-bold truncate group-hover:underline" title={title}>
                    {title}
                </p>
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
            </div>

            {/* Plateformes : un jeu cross-gen en a plusieurs (ex: PS4 + PS5) */}
            {platforms.length > 0 && (
                <div className="flex gap-1 shrink-0 self-start">
                    {platforms.map((p) => (
                        <span key={p} className="bg-navy-dark text-white text-xs font-bold px-2 py-1">
                            {p}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
