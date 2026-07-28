import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Tab = "login" | "register";

export default function ConnectionPage() {
    const [tab, setTab] = useState<Tab>("login");

    // Champs connexion
    const [loginField, setLoginField] = useState("");

    // Champs inscription
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { refresh } = useAuth();
    const navigate = useNavigate();

    // Gestion de la connexion d'un utilisateur
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!loginField || !password) {
            setError("Tous les champs sont requis");
            return;
        }
        setLoading(true);
        try {
            await login(loginField, password);
            await refresh();
            navigate("/");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    // Crée le compte puis redirige vers la page de liaison PSN
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password || !confirm) {
            setError("Tous les champs sont requis");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Email invalide");
            return;
        }
        if (password.length < 12) {
            setError("Le mot de passe doit faire au moins 12 caractères");
            return;
        }
        if (password !== confirm) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }
        setLoading(true);
        try {
            await register(email, password);
            await refresh();
            navigate("/link-psn");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur d'inscription");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent";
    const btnClass = "mt-2 bg-accent text-navy-dark font-bold py-3 rounded-lg uppercase tracking-wide hover:bg-accent/80 transition-colors disabled:opacity-50";

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-130px)] bg-background px-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl p-8">

                {/* Onglets */}
                <div className="flex mb-8 border-b border-border">
                    <button
                        className={`pb-3 px-4 text-sm font-semibold uppercase tracking-wide transition-colors ${tab === "login" ? "text-accent border-b-2 border-accent" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => { setTab("login"); setError(null); }}
                    >
                        Se connecter
                    </button>
                    <button
                        className={`pb-3 px-4 text-sm font-semibold uppercase tracking-wide transition-colors ${tab === "register" ? "text-accent border-b-2 border-accent" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => { setTab("register"); setError(null); }}
                    >
                        S'inscrire
                    </button>
                </div>

                {error && (
                    <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Connexion */}
                {tab === "login" && (
                    <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4">
                        <input className={inputClass} placeholder="Email" value={loginField} onChange={(e) => setLoginField(e.target.value)} />
                        <input type="password" className={inputClass} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="submit" disabled={loading} className={btnClass}>
                            {loading ? "Connexion..." : "Se connecter"}
                        </button>
                    </form>
                )}

                {/* Inscription */}
                {tab === "register" && (
                    <form onSubmit={handleRegister} noValidate className="flex flex-col gap-4">
                        <input type="text" className={inputClass} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <input type="password" className={inputClass} placeholder="Mot de passe (12 caractères min)" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <input type="password" className={inputClass} placeholder="Confirmer le mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                        <button type="submit" disabled={loading} className={btnClass}>
                            {loading ? "Création..." : "S'inscrire"}
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
}
