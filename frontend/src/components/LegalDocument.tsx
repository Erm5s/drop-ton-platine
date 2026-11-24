import { Link } from "react-router-dom";

/**
 * Mise en page commune aux documents juridiques (CGU, cookies, confidentialité).
 *
 * Ces pages ont toutes la même forme : un titre, une date de mise à jour, une phrase
 * d'accueil, puis des articles numérotés séparés par un filet. Seul le texte change, et il
 * est décrit sous forme de données par chaque page : décrire le contenu dans un tableau
 * évite de répéter les mêmes classes une centaine de fois et permet de corriger une phrase
 * sans toucher à la mise en page.
 *
 * Les textes acceptent deux marques inspirées de Markdown, traitées par `RichText` :
 * `**gras**` et `[libellé](lien)`. Elles couvrent tout ce dont ces documents ont besoin.
 */

/** Un bloc de contenu à l'intérieur d'un article. */
export type Block =
    /** Paragraphe courant. */
    | { kind: "text"; content: string }
    /** Paragraphe en retrait, pour un renvoi vers une autre page. */
    | { kind: "note"; content: string }
    /** Sous-titre d'un article. */
    | { kind: "heading"; content: string }
    /** Sous-titre discret, précédé d'une coche. */
    | { kind: "check"; content: string }
    /** Liste à puces, en retrait. */
    | { kind: "list"; items: string[] }
    /** Liste cochée, dans l'alignement du texte. */
    | { kind: "checklist"; items: string[] };

export type Article = { title: string; blocks: Block[] };

export default function LegalDocument({
    title,
    lastUpdate,
    intro,
    articles,
}: {
    title: string;
    lastUpdate: string;
    intro: string;
    articles: Article[];
}) {
    return (
        <div className="bg-white">
            <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
                <h1 className="text-3xl md:text-4xl font-bold text-navy-dark uppercase">{title}</h1>

                <p className="mt-5 text-sm font-bold text-navy-dark">Dernière mise à jour : {lastUpdate}</p>

                <p className="mt-5 text-charcoal leading-relaxed">
                    <RichText content={intro} />
                </p>

                {articles.map((article) => (
                    <section key={article.title}>
                        {/* Le filet sépare deux articles : il ouvre donc chaque article, et non le document */}
                        <hr className="my-12 border-gray-300" />

                        <h2 className="text-2xl md:text-3xl font-bold text-navy-dark">{article.title}</h2>

                        {article.blocks.map((block, index) => (
                            <ContentBlock key={index} block={block} />
                        ))}
                    </section>
                ))}
            </div>
        </div>
    );
}

function ContentBlock({ block }: { block: Block }) {
    switch (block.kind) {
        case "heading":
            return (
                <h3 className="mt-5 text-lg md:text-xl font-bold text-navy-dark">
                    <RichText content={block.content} />
                </h3>
            );

        case "check":
            return (
                <p className="mt-6 text-sm font-bold text-navy-dark">
                    <span aria-hidden="true">✔</span> <RichText content={block.content} />
                </p>
            );

        case "list":
            return (
                <ul className="mt-3 ml-6 md:ml-8 space-y-1 text-charcoal">
                    {block.items.map((item) => (
                        // Le tiret est dessiné à la main : la puce ronde du navigateur ne
                        // correspond pas à la maquette, qui aligne des tirets.
                        <li key={item} className="flex gap-2">
                            <span aria-hidden="true">-</span>
                            <span>
                                <RichText content={item} />
                            </span>
                        </li>
                    ))}
                </ul>
            );

        case "checklist":
            return (
                <ul className="mt-4 space-y-0.5 text-charcoal">
                    {block.items.map((item) => (
                        <li key={item} className="flex gap-2">
                            <span aria-hidden="true">✔</span>
                            <span>
                                <RichText content={item} />
                            </span>
                        </li>
                    ))}
                </ul>
            );

        case "note":
            return (
                <p className="mt-5 ml-4 md:ml-6 text-charcoal leading-relaxed">
                    <RichText content={block.content} />
                </p>
            );

        case "text":
            return (
                <p className="mt-5 text-charcoal leading-relaxed">
                    <RichText content={block.content} />
                </p>
            );
    }
}

// Découpe le texte en trois groupes : **gras**, [libellé](lien), ou texte ordinaire.
const RICH_TEXT = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;

/**
 * Rend un texte portant les deux marques acceptées par ces pages.
 *
 * Une vraie bibliothèque Markdown serait disproportionnée ici : elle ajouterait une
 * dépendance et une surface de rendu HTML pour deux motifs connus d'avance.
 */
function RichText({ content }: { content: string }) {
    const parts: React.ReactNode[] = [];
    let cursor = 0;

    for (const match of content.matchAll(RICH_TEXT)) {
        const [whole, bold, label, href] = match;
        const start = match.index;

        if (start > cursor) {
            parts.push(content.slice(cursor, start));
        }

        if (bold !== undefined) {
            parts.push(<strong key={start}>{bold}</strong>);
        } else if (href.startsWith("http")) {
            // Un lien sortant ne passe pas par le routeur : il quitte l'application
            parts.push(
                <a key={start} href={href} target="_blank" rel="noreferrer" className="text-accent underline">
                    {label}
                </a>,
            );
        } else {
            parts.push(
                <Link key={start} to={href} className="text-accent underline">
                    {label}
                </Link>,
            );
        }

        cursor = start + whole.length;
    }

    parts.push(content.slice(cursor));

    return <>{parts}</>;
}
