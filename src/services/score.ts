import { prisma } from "@/db";

/**
 * Calcul des points d'un joueur.
 *
 * Règle : terminer la liste de base d'un jeu rapporte la totalité de ses points, et chaque
 * liste additionnelle (DLC) terminée rapporte l'équivalent de sa difficulté.
 *
 *   Elden Ring, 25 points, difficulté 5
 *   liste de base terminée .................. 25 points
 *   chacun de ses 2 DLC terminés ............  5 points
 *   total si tout est fini .................. 35 points
 *
 * Un jeu sans barème rapporte 0 : la difficulté et les points viennent du fichier importé,
 * et tous les jeux du catalogue n'y figurent pas.
 */

export type GameScore = {
    gameId: string;
    title: string;
    points: number | null;
    difficulty: number | null;
    /** La liste de base est-elle terminée à 100 % ? */
    baseCompleted: boolean;
    /** Nombre de listes additionnelles terminées à 100 %. */
    dlcCompleted: number;
    /** Points effectivement acquis sur ce jeu. */
    earnedPoints: number;
    /** Total possible : la liste de base plus chaque DLC valorisé à sa difficulté. */
    maxPoints: number;
    /** Nombre total de trophées du jeu, toutes listes confondues. */
    trophyCount: number;
    /**
     * Faux pour une variante régionale déjà comptée : le jeu est rattaché en base à un autre
     * exemplaire (voir Game.canonicalId) que le joueur possède aussi. Ses points ne comptent
     * pas, seul le meilleur exemplaire du groupe est retenu.
     */
    counted: boolean;
};

/**
 * Détaille les points d'un joueur, jeu par jeu.
 *
 * Renvoie tous les jeux du joueur, y compris ceux à zéro point : la page profil affiche
 * "0/35" pour un jeu commencé mais non terminé.
 *
 * Le calcul est fait par Postgres en une requête : ramener les trophées d'un joueur pour
 * compter côté JavaScript représenterait des dizaines de milliers de lignes transférées.
 *
 * @param userId L'identifiant PSN du joueur
 * @returns Les jeux rapportant au moins un point, du plus rémunérateur au moins
 */
export async function getUserGameScores(userId: string): Promise<GameScore[]> {
    return prisma.$queryRaw<GameScore[]>`
        WITH groupes AS (
            -- Un groupe par liste de trophées : combien elle en compte, combien le joueur a
            SELECT
                trophee."gameId",
                trophee."groupId",
                count(*) AS total,
                count(obtenu."trophyId") AS earned
            FROM "Trophy" trophee
            -- Restreint aux jeux du joueur : sans ça on balaierait tout le catalogue
            JOIN "UserGame" jeu
                ON jeu."gameId" = trophee."gameId" AND jeu."userId" = ${userId}
            LEFT JOIN "UserTrophy" obtenu
                ON obtenu."gameId" = trophee."gameId"
               AND obtenu."trophyId" = trophee."trophyId"
               AND obtenu."userId" = ${userId}
            GROUP BY trophee."gameId", trophee."groupId"
        ),
        parJeu AS (
            SELECT
                jeu.id AS "gameId",
                jeu.title,
                jeu.points,
                jeu.difficulty,
                coalesce(jeu."canonicalId", jeu.id) AS "canonicalId",
                sum(groupes.total)::int AS "trophyCount",
                coalesce(bool_or(groupes."groupId" = 'default' AND groupes.total = groupes.earned), false) AS "baseCompleted",
                count(*) FILTER (WHERE groupes."groupId" <> 'default' AND groupes.total = groupes.earned)::int AS "dlcCompleted",
                (
                    CASE WHEN bool_or(groupes."groupId" = 'default' AND groupes.total = groupes.earned)
                         THEN coalesce(jeu.points, 0) ELSE 0 END
                    + count(*) FILTER (WHERE groupes."groupId" <> 'default' AND groupes.total = groupes.earned)
                      * coalesce(jeu.difficulty, 0)
                )::int AS "earnedPoints",
                -- Maximum atteignable : la liste de base, plus un lot de points par DLC existant
                (
                    coalesce(jeu.points, 0)
                    + count(*) FILTER (WHERE groupes."groupId" <> 'default') * coalesce(jeu.difficulty, 0)
                )::int AS "maxPoints"
            FROM groupes
            JOIN "Game" jeu ON jeu.id = groupes."gameId"
            GROUP BY jeu.id, jeu.title, jeu.points, jeu.difficulty, jeu."canonicalId"
        )
        -- Les variantes régionales d'un même jeu partagent le même canonicalId : un seul
        -- exemplaire compte, celui où le joueur a le mieux réussi.
        SELECT
            "gameId", title, points, difficulty, "trophyCount",
            "baseCompleted", "dlcCompleted", "earnedPoints", "maxPoints",
            row_number() OVER (
                PARTITION BY "canonicalId"
                ORDER BY "earnedPoints" DESC, "gameId" ASC
            ) = 1 AS counted
        FROM parJeu
        ORDER BY "earnedPoints" DESC, title ASC
    `;
}

/**
 * Total des points d'un joueur.
 *
 * @param userId L'identifiant PSN du joueur
 */
export async function getUserTotalPoints(userId: string): Promise<number> {
    const scores = await getUserGameScores(userId);
    return scores
        .filter(score => score.counted)
        .reduce((total, score) => total + score.earnedPoints, 0);
}

