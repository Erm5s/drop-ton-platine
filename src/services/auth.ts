import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = 12; // 250ms par itération

// Hashage du mot de passe
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

// Comparaison de deux mot de passe hashés
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// Génération du JWT signé avec l'id du compte (valable 7j)
export function signToken(accountId: string): string {
    return jwt.sign({ accountId }, JWT_SECRET, { expiresIn: "7d" });
}

// Vérification de la signature du token et return du contenu (Exception si expiré)
export function verifyToken(token: string): { accountId: string } {
    return jwt.verify(token, JWT_SECRET) as { accountId: string };
}