import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { startPsnLink, verifyPsnLink } from "@/lib/api";

export default function LinkPSNPage() {
    const { user, refresh } = useAuth();
    const [code, setCode] = useState<string | null>(null);
    const [psnUsername, setPsnUsername] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleStart = async () => {
        setError(null);
        setLoading(true);
        try {
            const res = await startPsnLink();
            setCode(res.code);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await verifyPsnLink(psnUsername);
            await refresh();
            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur de vérification");
        } finally {
            setLoading(false);
        }
    };

    if (success || user?.psnId) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-130px)] bg-background px-4">
                <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 text-center">
                    <h2 className="text-xl font-bold text-foreground mb-2">Compte PSN lié</h2>
                    <p className="text-muted-foreground">
                        Ton compte PSN <span className="text-accent font-semibold">{user?.psnUsername}</span> est bien lié à ton compte Drop Ton Platine.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-130px)] bg-background px-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl p-8">
                <h2 className="text-xl font-bold text-foreground mb-2">Lier ton compte PSN</h2>
                <p className="text-muted-foreground text-sm mb-6">
                    Prouve que tu es bien le propriétaire du compte PSN en ajoutant un code dans ta bio PlayStation.
                </p>

                {error && (
                    <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                        {error}
                    </div>
                )}

                {!code && (
                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="w-full bg-accent text-navy-dark font-bold py-3 rounded-lg uppercase tracking-wide hover:bg-accent/80 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Génération..." : "Générer mon code de vérification"}
                    </button>
                )}

                {code && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-background border border-accent/40 rounded-lg p-4 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Ton code de vérification</p>
                            <p className="text-2xl font-mono font-bold text-accent tracking-widest">{code}</p>
                        </div>

                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                            <li>Va sur <span className="text-foreground">PlayStation.com</span> ou le PS App</li>
                            <li>Paramètres → Profil → À propos de moi</li>
                            <li>Colle le code dans ta bio et sauvegarde</li>
                            <li>Reviens ici et entre ton pseudo PSN</li>
                        </ol>

                        <form onSubmit={handleVerify} className="flex flex-col gap-3">
                            <input
                                className="bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                                placeholder="Ton pseudo PSN"
                                value={psnUsername}
                                onChange={(e) => setPsnUsername(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-accent text-navy-dark font-bold py-3 rounded-lg uppercase tracking-wide hover:bg-accent/80 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Vérification..." : "Vérifier et lier"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
