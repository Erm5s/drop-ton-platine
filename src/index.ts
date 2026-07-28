import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "@/utils/errors";
import cookieParser from "cookie-parser";
// @/routes
import profileRouter from "@/routes/profile";
import gamesRouter from "@/routes/games";
import trophiesRouter from "@/routes/trophies";
import authRouter from "@/routes/auth";

const app = express();
const PORT = process.env.PORT;

// Headers HTTP automatiques
app.use(helmet());
// Autorise tous les ports à appeler l'API
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
// Permet de lire le body JSON des requêtes POST/PUT
app.use(express.json());
// Parse les cookies entrants pour rendre req.cookies disponible
app.use(cookieParser());

// Routes
app.use("/api/profile", profileRouter);
app.use("/api/games", gamesRouter);
app.use("/api/trophies", trophiesRouter);
app.use("/api/auth", authRouter);

// Vérifie que le serveur est vivant
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

// Gestion centralisée des erreurs
app.use(errorHandler);

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
