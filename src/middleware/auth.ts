import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/services/auth";

// Étend le type Request d'Express pour que req.accountId soit reconnu par TypeScript partout
declare global {
    namespace Express {
        interface Request {
            accountId: string;
        }
    }
}

// Middleware à placer sur les routes qui nécessitent d'être connecté
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).json({ error: "Non authentifié" });
        return;
    }
    try {
        const payload = verifyToken(token);
        // Attache l'id du compte à la requête pour que les routes suivantes y accèdent
        req.accountId = payload.accountId;
        next();
    } catch {
        // Token expiré, falsifié, ou mal formé
        res.status(401).json({ error: "Session invalide ou expirée" });
    }
}
