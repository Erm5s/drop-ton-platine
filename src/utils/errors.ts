import type { Request, Response, NextFunction } from "express";

/**
 * Erreur HTTP personnalisée.
 * Permet de lancer une erreur avec un code HTTP précis.
 */
export class AppError extends Error {
    /**
     * @param statusCode Le code HTTP à renvoyer au client
     * @param message Le message d'erreur lisible
     */
    constructor(public statusCode: number, message: string) {
        super(message); // initialise la vraie Error JS avec le message
    }
}

/**
 * Middleware Express de gestion centralisée des erreurs.
 * Doit être enregistré en dernier avec `app.use(errorHandler)`.
 *
 * Si l'erreur est une AppError, répond avec son statusCode et son message
 * Sinon, erreur inattendue, répond 500 et log en console
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
}
