import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getMe, logout as apiLogout } from "@/lib/api";

type AuthUser = {
    id: string;
    username: string | null;
    psnId: string | null;
    psnUsername: string | null;
};

type AuthContextType = {
    user: AuthUser | null;
    loading: boolean;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Composant gérant le statut d'authentification d'un utilisateur
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        try {
            const me = await getMe();
            setUser(me);
        } catch {
            setUser(null);
        }
    };

    const logout = async () => {
        await apiLogout();
        setUser(null);
    };

    useEffect(() => {
        async function loadUser() {
            try {
                const me = await getMe();
                setUser(me);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refresh, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook pour accéder au AuthContext dans n'importe quel composant
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
    return ctx;
}
