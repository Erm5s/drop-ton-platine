import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "@/utils/errors";
import profileRouter from "@/routes/profile";
import gamesRouter from "@/routes/games";
import trophiesRouter from "@/routes/trophies";

const app = express();
const PORT = process.env.PORT;

// Sécurité : headers HTTP automatiques
app.use(helmet());
// Autorise tous les ports à appeler l'API
app.use(cors());
// Permet de lire le body JSON des requêtes POST/PUT
app.use(express.json());

// Routes
app.use("/api/profile", profileRouter);
app.use("/api/games", gamesRouter);
app.use("/api/trophies", trophiesRouter);

// Vérifie que le serveur est vivant (utilisé par les outils de déploiement)
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

// Gestion centralisée des erreurs — doit être en dernier
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
