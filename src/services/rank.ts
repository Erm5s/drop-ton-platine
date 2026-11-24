/**
 * Rangs du classement, déduits du total de points d'un joueur.
 *
 * Les paliers viennent du barème affiché sur la page classement. Un rang se garde tant que
 * le palier suivant n'est pas atteint : à 1 200 points on est Argent 3, pas encore Argent 2.
 */

export type RankTier = "bronze" | "argent" | "or" | "platine";

export type Rank = {
    tier: RankTier;
    /** 3 est le premier palier du métal, 1 le dernier. */
    level: 1 | 2 | 3;
    /** Libellé affiché, par exemple « Platine 1 ». */
    label: string;
    /** Points à partir desquels le rang est acquis. */
    threshold: number;
};

/** Du plus élevé au plus bas : le premier palier atteint est le bon. */
export const RANKS: Rank[] = [
    { tier: "platine", level: 1, label: "Platine 1", threshold: 8000 },
    { tier: "platine", level: 2, label: "Platine 2", threshold: 6500 },
    { tier: "platine", level: 3, label: "Platine 3", threshold: 5000 },
    { tier: "or", level: 1, label: "Or 1", threshold: 4000 },
    { tier: "or", level: 2, label: "Or 2", threshold: 3500 },
    { tier: "or", level: 3, label: "Or 3", threshold: 3000 },
    { tier: "argent", level: 1, label: "Argent 1", threshold: 1600 },
    { tier: "argent", level: 2, label: "Argent 2", threshold: 1300 },
    { tier: "argent", level: 3, label: "Argent 3", threshold: 1000 },
    { tier: "bronze", level: 1, label: "Bronze 1", threshold: 500 },
    { tier: "bronze", level: 2, label: "Bronze 2", threshold: 250 },
    { tier: "bronze", level: 3, label: "Bronze 3", threshold: 0 },
];

/** Palier de repli, pour un total négatif : il ne devrait jamais s'en présenter. */
const LOWEST: Rank = { tier: "bronze", level: 3, label: "Bronze 3", threshold: 0 };

/** Le rang correspondant à un total de points. Le dernier palier vaut 0, il attrape tout. */
export function rankForPoints(points: number): Rank {
    return RANKS.find(rank => points >= rank.threshold) ?? LOWEST;
}
