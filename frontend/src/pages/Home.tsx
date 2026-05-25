import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const [username, setUsername] = useState("");
    const navigate = useNavigate();

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const trimmed = username.trim();
        if (trimmed) navigate(`/${trimmed}`);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8">
            <h1 className="text-4xl font-bold tracking-tight">
                Drop Ton <span className="text-accent">Platine</span>
            </h1>
            <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-sm">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Pseudo PSN..."
                    className="flex-1 bg-card border border-border rounded-lg px-4 py-2 text-sm outline-none focus:border-accent transition-colors"
                />
                <button
                    type="submit"
                    className="bg-accent text-white font-semibold px-5 py-2 rounded-lg hover:bg-accent/80 transition-colors"
                >
                    Recherche
                </button>
            </form>
        </div>
    );
}
