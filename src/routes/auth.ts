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
            include: { 
                user: {
                     select: { 
                        username: true,
                        avatarUrl : true
                    } 
                }
            },
        });
        if (!account) throw new AppError(401, "Compte introuvable");

        res.json({ // réponse json
            id: account.id,
            username: account.username,
            psnId: account.psnId,
            psnUsername: account.user?.username,
            avatarUrl: account.user?.avatarUrl,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/register
router.post("/register", authLimiter, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Vérifications basiques de remplissage des champs
        if (!email || !password)
            throw new AppError(400, "Tous les champs sont requis");
        if (password.length < 12)
            throw new AppError(400, "Le mot de passe doit faire au moins 12 caractères");

        // AppError 409 si le mail est déjà attribué
        const existing = await prisma.account.findUnique({ where: { email } });
        if (existing) throw new AppError(409, "Cet email est déjà utilisé");

        // Hashage du mot de passe et création du compte dans la DB
        const passwordHash = await hashPassword(password);
        const account = await prisma.account.create({
            data: { email, passwordHash },
        });

        const token = signToken(account.id); // génération du JWT
        res.cookie("token", token, COOKIE_OPTIONS); // envoie du cookie au navigateur
        res.status(201).json({ id: account.id, username: account.username }); // réponse json
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
        res.json({ id: account.id, username: account.username, psnId: account.psnId }); // réponse json
    } catch (err) {
        next(err);
    }
});

// POST /api/logout
router.post("/logout", (_req, res) => {
    res.clearCookie("token");
    res.json({ ok: true });
});

// POST /api/link-start
router.post("/psn/link-start", requireAuth, async (req, res, next) => {
    try {
        // Génère un code du format "DTP-XXXXXXXX" et l'enregistre dans la DB
        const code = "DTP-" + Math.random().toString(36).slice(2, 10).toUpperCase();
        await prisma.account.update({
            where: { id: req.accountId },
            data: { psnVerifyCode: code },
        });

        res.json({ code }); // réponse json
    } catch (err) {
        next(err);
    }
});

// POST /api/psn/link-verify
router.post("/psn/link-verify", requireAuth, async (req, res, next) => {
    try {
        const { psnUsername } = req.body;

        // Vérification du remplissage du champ
        if (!psnUsername) 
            throw new AppError(400, "Pseudo PSN requis");

        // Vérifie si un code est géneré pour le compte connecté
        const account = await prisma.account.findUnique({ where: { id: req.accountId } });
        if (!account?.psnVerifyCode) 
            throw new AppError(400, "Code non généré");


        // Fetch le compte PSN renseigné et vérifie si elle existe
        let profile;
        try {
            profile = (await fetchProfile(psnUsername)).profile;
        } catch (err) {
            if (err instanceof Error && err.message.includes("User not found")) {
                throw new AppError(404, "Ce compte PSN n'existe pas");
            }
            throw err; 
        }

        // Vérifie si elle contient le code
        if (!(profile.aboutMe ?? "").includes(account.psnVerifyCode))
            throw new AppError(400, "Code incorrect ou non trouvé dans la bio PSN");

        // Vérifie si ce compte PSN est déjà lié à un autre compte DTP
        const alreadyLinked = await prisma.account.findUnique({ where: { psnId: profile.accountId } });
        if (alreadyLinked && alreadyLinked.id !== req.accountId)
            throw new AppError(409, "Ce compte PSN est déjà lié à un autre compte DTP");

        // Associe le compte PSN au compte DTP si tout est bon
        await prisma.account.update({
            where: { id: req.accountId },
            data: { psnId: profile.accountId, psnVerifyCode: null },
        });

        res.json({ ok: true, psnId: profile.accountId, psnUsername: profile.onlineId }); // réponse json
    } catch (err) {
        next(err);
    }
});

export default router;
