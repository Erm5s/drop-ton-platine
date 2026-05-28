import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "@/db";
import { hashPassword, verifyPassword, signToken } from "@/services/auth";
import { requireAuth } from "@/middleware/auth";
import { AppError } from "@/utils/errors";
import { fetchProfile } from "@/services/psn";

const router = Router();

// httpOnly : protection contre vol de cookie
// secure : cookie envoyé en HTTPS uniquement 
// sameSite "lax" : cookie envoyé pour les requêtes du même nom de domaine
// maxAge : cookie automatiquement supprimé après 7 jours
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false, // CQFPO
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Anti-bruteforce, limite de 10 requêtes toutes les 10 minutes
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: { error: "Trop de tentatives, réessayez dans 10 minutes" },
});

// GET /api/me
router.get("/me", requireAuth, async (req, res, next) => {
    try {
        // Cherche l'utilisateur dans la DB via l'id dans le cookie 
        const account = await prisma.account.findUnique({
            where: { id: req.accountId },
            include: { user: { select: { username: true } } },
        });
        if (!account) throw new AppError(401, "Compte introuvable");

        res.json({ // retour json
            id: account.id,
            username: account.username,
            psnId: account.psnId,
            psnUsername: account.user?.username,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/register
router.post("/register", authLimiter, async (req, res, next) => {
    try {
        const { email, username, password } = req.body;

        // Vérifications basiques de remplissage et longueur des champs
        if (!email || !username || !password)
            throw new AppError(400, "Tous les champs sont requis");
        if (username.length < 3 || username.length > 16)
            throw new AppError(400, "Le pseudo doit faire entre 3 et 16 caractères");
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(username))
            throw new AppError(400, "Le pseudo ne peut seulement contenir des lettres, chiffres, \"_\" et \"-\"");
        if (password.length < 8)
            throw new AppError(400, "Le mot de passe doit faire au moins 8 caractères");

        // AppError 409 si le mail ou le pseudo est déjà attribué
        const existing = await prisma.account.findFirst({
            where: { 
                OR: [
                    { email }, 
                    { username }
                ] 
            },
        });
        if (existing) {
            throw new AppError(409, existing.email === email ? "Cet email est déjà utilisé" : "Ce pseudo est déjà utilisé");
        }

        // Hashage du mot de passe et création du compte dans la DB
        const passwordHash = await hashPassword(password);
        const account = await prisma.account.create({
            data: { email, username, passwordHash },
        });

        const token = signToken(account.id); // génération du JWT
        res.cookie("token", token, COOKIE_OPTIONS); // envoie du cookie au navigateur
        res.status(201).json({ id: account.id, username: account.username }); // retour json (HTTP 201 = Created)
    } catch (err) {
        next(err);
    }
});

// POST /api/login
router.post("/login", authLimiter, async (req, res, next) => {
    try {
        const { login, password } = req.body;

        // Vérification du remplissage des champs
        if (!login || !password)
            throw new AppError(400, "Tous les champs sont requis");

        // AppError 401 si la combinaison login/mot de passe est incorrecte   
        const account = await prisma.account.findFirst({ 
            where: { 
                OR: [
                    { username: login },
                    { email: login },
                ],
            } 
        });
        if (!account || !(await verifyPassword(password, account.passwordHash)))
            throw new AppError(401, "Login ou mot de passe incorrect");

        const token = signToken(account.id); // génération du JWT
        res.cookie("token", token, COOKIE_OPTIONS); // envoie du cookie au navigateur
        res.json({ id: account.id, username: account.username, psnId: account.psnId }); // retour json
    } catch (err) {
        next(err);
    }
});

// POST /api/logout
router.post("/logout", (_req, res) => {
    res.clearCookie("token");
    res.json({ ok: true });
});

// POST /api/link/start
router.post("/psn/link/start", requireAuth, async (req, res, next) => {
    try {
        // Génère un code du format "DTP-XXXXXXXX" et l'enregistre dans la DB
        const code = "DTP-" + Math.random().toString(36).slice(2, 10).toUpperCase();
        await prisma.account.update({
            where: { id: req.accountId },
            data: { psnVerifyCode: code },
        });

        res.json({ code }); // retour json
    } catch (err) {
        next(err);
    }
});

// POST /api//psn/link/verify
router.post("/psn/link/verify", requireAuth, async (req, res, next) => {
    try {
        const { psnUsername } = req.body;

        // Vérification du remplissage du champ
        if (!psnUsername) 
            throw new AppError(400, "Pseudo PSN requis");

        // Vérifie si un code est géneré pour le compte connecté
        const account = await prisma.account.findUnique({ where: { id: req.accountId } });
        if (!account?.psnVerifyCode) 
            throw new AppError(400, "Code non généré");

        // Fetch la bio du compte PSN renseigné et vérifie si elle contient le code
        const profile = (await fetchProfile(psnUsername)).profile;
        if (!profile.aboutMe.includes(account.psnVerifyCode))
            throw new AppError(400, "Code incorrect ou non trouvé dans la bio PSN");

        // Associe le compte PSN au compte DTP si tout est bon
        await prisma.account.update({
            where: { id: req.accountId },
            data: { psnId: profile.accountId, psnVerifyCode: null },
        });

        res.json({ ok: true, psnId: profile.accountId, psnUsername: profile.onlineId }); // retour json
    } catch (err) {
        next(err);
    }
});

export default router;
