/**
 * Normalise les noms de listes de trophées PSN pour le stockage et l'affichage.
 *
 * Retire les mentions propres aux listes de trophées, uniformise les séparateurs, 
 * puis applique la casse de titre APA.
 */

// Articles, conjonctions de coordination et prépositions courtes : en minuscules 
// sauf en première ou dernière position, ou après une ponctuation forte.
const LOWERCASE_WORDS = new Set([
    // Articles
    "a", "an", "the",
    // Conjonctions de coordination
    "and", "but", "or", "nor", "for",
    // Prépositions de trois lettres ou moins
    "as", "at", "by", "in", "of", "on", "per", "to", "via", "off",
    // Autres formes tolérées en minuscules
    "vs", "vs.",
]);

const ACRONYMS = new Set(["VR", "HD"]);

// Préfixes de séries à qui il manque le deux-points. Les plus longs d'abord, pour que
// "Arcade Archives 2" l'emporte sur "Arcade Archives".
const ARCHIVE_SERIES_PREFIXES = ["Arcade Archives 2", "Arcade Archives", "Console Archives"];

const PREFIX_PATTERNS = [
    /^Trophy Set For\b[:\s-]*/i,
    /^Trophy Set\b[:\s-]*/i,
    /^Trophyset\b[:\s-]*/i,
];

// Ordre significatif : le premier motif qui correspond est le seul appliqué.
const SUFFIX_PATTERNS = [
    /\s*Trophy Set\.$/i,
    /\s*Trophy Pack$/i,
    /\s*Trophy Set$/i,
    /\s*Trophyset\.$/i,
    /\s*Trophyset$/i,
    /\s*Trophies$/i,
    /\s*Trophy$/i,
];

const ROMAN_NUMERAL = /^(?=[IVXLCDM]+$)M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

// Ponctuation encadrant un mot, isolée avant d'en traiter le cœur.
const WORD_PUNCTUATION = /^([\\"'“‘([{]*)(.*?)([\\"'”’)\]}.,:;!?]*)$/u;

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Nettoie puis met en casse de titre. */
export function formatTrophyTitleName(name: string): string {
    return toApaTitleCase(sanitize(name));
}

export function sanitize(rawName: string): string {
    let name = rawName
        .trim()
        .replace(/[™®©]/g, "")
        .replace(/–/g, "-")
        .replace(/[’´`]/g, "'")
        .replace(/\s*:\s*/g, ": ")
        .replace(/(?:\s+-\s*|\s*-\s+)/g, " - ");

    if (name === "") {
        return name;
    }

    for (const pattern of PREFIX_PATTERNS) {
        name = name.replace(pattern, "");
    }

    const matchingSuffix = SUFFIX_PATTERNS.find(pattern => pattern.test(name));
    if (matchingSuffix) {
        name = name.replace(matchingSuffix, "");
    }

    if (name.endsWith("-")) {
        name = name.slice(0, -1).trimEnd();
    }

    name = ensureArchiveSeriesPrefixColon(name);
    name = normalizeTitleSeparators(name);

    name = name.trimEnd();
    if (name !== "") {
        name = name.replace(/\.+$/, "");
    }

    return name.trim();
}

/**
 * Insère un deux-points après un préfixe de série connu quand il manque.
 */
function ensureArchiveSeriesPrefixColon(name: string): string {
    if (name === "") {
        return name;
    }

    for (const prefix of ARCHIVE_SERIES_PREFIXES) {
        const matched = new RegExp(`^${escapeRegExp(prefix)}\\b`, "i").exec(name);
        if (!matched) {
            continue;
        }

        const remainder = name.slice(matched[0].length);

        // Le deux-points est déjà là : on ne touche à rien
        if (/^\s*:/.test(remainder)) {
            return name;
        }

        const rest = /^\s+(\S.*)$/u.exec(remainder);
        if (!rest) {
            return name;
        }

        return `${matched[0]}: ${rest[1]}`;
    }

    return name;
}

/**
 * Fait alterner les séparateurs de sous-titre et de contenu additionnel.
 *
 * Un deux-points introduit un sous-titre, un tiret introduit la section suivante. Après un
 * tiret, la convention repart de zéro : cette section peut avoir son propre sous-titre.
 */
function normalizeTitleSeparators(name: string): string {
    let hasSubtitle = false;

    return name.replace(/: | - /g, () => {
        const separator = hasSubtitle ? " - " : ": ";
        hasSubtitle = !hasSubtitle;
        return separator;
    });
}

export function toApaTitleCase(rawTitle: string): string {
    const title = rawTitle.trim();

    if (title === "") {
        return title;
    }

    const words = title.split(/\s+/u);
    const convertedWords: string[] = [];
    let capitalizeNext = false;

    for (const [index, word] of words.entries()) {
        if (word === "") {
            convertedWords.push("");
            continue;
        }

        const matched = WORD_PUNCTUATION.exec(word);
        const leadingPunctuation = matched?.[1] ?? "";
        const coreWord = matched?.[2] ?? word;
        const trailingPunctuation = matched?.[3] ?? "";

        if (coreWord === "") {
            convertedWords.push(word);
            capitalizeNext = shouldCapitalizeAfterPunctuation(word);
            continue;
        }

        const isFirstWord = index === 0;
        const isLastWord = index === words.length - 1;
        const forceCapitalize = capitalizeNext || isFirstWord || isLastWord;

        convertedWords.push(leadingPunctuation + formatTitleWord(coreWord, forceCapitalize) + trailingPunctuation);

        capitalizeNext = coreWord === "-" || shouldCapitalizeAfterPunctuation(trailingPunctuation);
    }

    return convertedWords.join(" ");
}

function formatTitleWord(word: string, forceCapitalize: boolean): string {
    // Chaque segment d'un mot composé se capitalise indépendamment
    if (word.includes("-")) {
        return word
            .split("-")
            .map(segment => formatTitleWord(segment, true))
            .join("-");
    }

    const wordLower = word.toLowerCase();

    if (!forceCapitalize && LOWERCASE_WORDS.has(wordLower)) {
        return wordLower;
    }

    if (shouldPreserveTitleWord(word)) {
        return word;
    }

    return uppercaseFirstCharacter(wordLower);
}

/** Un mot déjà porteur d'une casse voulue ne doit pas être réécrit. */
function shouldPreserveTitleWord(word: string): boolean {
    if (word === "") {
        return true;
    }

    if (ACRONYMS.has(word)) {
        return true;
    }

    if (/\d/.test(word) || word.includes(".") || word.includes("&")) {
        return true;
    }

    if (ROMAN_NUMERAL.test(word.toUpperCase())) {
        return true;
    }

    // Casse mixte (ex: "flOw", "PlayStation") : c'est une intention, on la garde
    const lower = word.toLowerCase();
    const upper = word.toUpperCase();

    return word !== lower && word !== upper;
}

/**
 * Équivalent de `mb_convert_case(MB_CASE_TITLE)` : chaque suite de lettres voit sa première
 * lettre passer en majuscule. L'apostrophe coupe donc le mot, comme en PHP.
 */
function uppercaseFirstCharacter(word: string): string {
    return word.replace(/\p{L}+/gu, run => run.charAt(0).toUpperCase() + run.slice(1).toLowerCase());
}

function shouldCapitalizeAfterPunctuation(punctuation: string): boolean {
    if (punctuation === "") {
        return false;
    }

    return [":", "!", "?", "."].some(character => punctuation.includes(character));
}

/**
 * Construit la clé de tri d'un jeu : un chiffre de catégorie suivi du titre normalisé.
 *
 * L'ordre voulu est ponctuation, puis chiffres, puis alphabet latin, puis écritures
 * étrangères. Aucune collation ne donne cet ordre, d'où cette clé stockée et indexée : la
 * comparaison redevient un simple tri d'octets, que Postgres sert directement par l'index.
 *
 * Les accents sont retirés pour que "Öoo" se range près de "O" et non après "Z".
 */
export function buildGameSortKey(title: string): string {
    const normalized = title
        .trim()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();

    const first = normalized.charAt(0);

    const bucket =
        /[0-9]/.test(first) ? "2"
        : /[a-z]/.test(first) ? "3"
        : first !== "" && first.charCodeAt(0) > 127 ? "4"
        : "1";

    return bucket + normalized;
}
