import { Link } from "react-router-dom";
import { SocialIcon, SOCIAL_LABELS, type SocialName } from "@/lib/socialIcons";

/**
 * Pied de page commun à toutes les pages.
 *
 * Les icônes sociales sont des SVG intégrés plutôt que des fichiers : elles sont
 * monochromes et doivent suivre la couleur du thème.
 */

type FooterLink = { label: string; href: string };

/** Une colonne est une suite de blocs, séparés visuellement par un filet bleu. */
type FooterBlock = { title?: string; links: FooterLink[] };

const COLUMNS: FooterBlock[][] = [
    [
        {
            title: "Entraide",
            links: [
                { label: "Guides", href: "/guides" },
                { label: "Crew", href: "/crew" },
                { label: "Boost", href: "/boost" },
                { label: "Helper", href: "/helper" },
            ],
        },
        {
            title: "Articles",
            links: [
                { label: "Nos tests", href: "/tests" },
                { label: "Communiqués de presse", href: "/communiques" },
            ],
        },
        { links: [{ label: "Jeux", href: "/games" }] },
    ],
    [
        {
            title: "Outils",
            links: [
                { label: "Trophées impossibles", href: "/impossibles" },
                { label: "Fermetures serveurs", href: "/fermetures" },
            ],
        },
        {
            title: "Legal",
            links: [
                { label: "CGU", href: "/cgu" },
                { label: "Politique des cookies", href: "/cookies" },
                { label: "Politique de confidentialité", href: "/confidentialite" },
            ],
        },
        {
            links: [
                { label: "Classement", href: "/classement" },
                { label: "PSPlus", href: "/psplus" },
            ],
        },
    ],
    [
        {
            title: "Informations",
            links: [
                { label: "Qui sommes-nous", href: "/qui-sommes-nous" },
                { label: "Équipe", href: "/equipe" },
            ],
        },
        {
            title: "Social",
            links: [
                { label: "Partenaires", href: "/partenaires" },
                { label: "Créateurs", href: "/createurs" },
            ],
        },
    ],
];

const CONTACT_EMAIL = "assistance@dtp.com";

const SOCIALS: { name: SocialName; href: string }[] = [
    { name: "x", href: "https://x.com/DropTonPlatine" },
    { name: "instagram", href: "https://www.instagram.com/droptonplatine" },
    { name: "facebook", href: "https://www.facebook.com/61571099947288/" },
    { name: "tiktok", href: "https://www.tiktok.com/@droptonplatine" },
    { name: "youtube", href: "https://www.youtube.com/@DROPTONPLATINE" },
    { name: "discord", href: "https://discord.gg/rtp4C36PRP" },
];

export default function Footer() {
    return (
        <footer
            className="w-full text-white"
            style={{ background: "linear-gradient(180deg, var(--color-navy), var(--color-navy-dark))" }}
        >
            <div className="max-w-7xl mx-auto px-10 py-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
                {/* Logo et réseaux */}
                <div>
                    <img src="/images/name_logo.png" alt="Drop Ton Platine" className="h-16 w-auto" />

                    <Separator className="mt-6 mb-5" />

                    <p className="font-bold uppercase tracking-wide mb-3">Nos réseaux</p>
                    <div className="flex flex-wrap gap-3 max-w-[13rem]">
                        {SOCIALS.map(({ name, href }) => (
                            <a
                                key={name}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={SOCIAL_LABELS[name]}
                                title={SOCIAL_LABELS[name]}
                                className="flex items-center justify-center w-14 h-14 bg-accent rounded-sm transition-opacity hover:opacity-80"
                            >
                                <SocialIcon name={name} className="w-7 h-7 text-white" />
                            </a>
                        ))}
                    </div>
                </div>

                {COLUMNS.map((blocks, columnIndex) => (
                    <div key={columnIndex}>
                        {blocks.map((block, blockIndex) => (
                            <div key={block.title ?? blockIndex}>
                                {blockIndex > 0 && <Separator className="my-5" />}
                                {block.title && (
                                    <p className="font-bold uppercase tracking-wide mb-3">{block.title}</p>
                                )}
                                <ul className="space-y-2">
                                    {block.links.map(({ label, href }) => (
                                        <li key={href}>
                                            <Link
                                                to={href}
                                                className="uppercase text-white/90 hover:text-accent transition-colors"
                                            >
                                                {label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {/* Le contact ne figure que dans la dernière colonne */}
                        {columnIndex === COLUMNS.length - 1 && (
                            <div>
                                <Separator className="my-5" />
                                <p className="font-bold uppercase tracking-wide mb-3">Nous contacter</p>
                                <a
                                    href={`mailto:${CONTACT_EMAIL}`}
                                    className="italic text-white/90 hover:text-accent transition-colors"
                                >
                                    {CONTACT_EMAIL}
                                </a>
                                <p className="mt-2">
                                    <Link to="/ticket" className="uppercase text-white/90 hover:text-accent transition-colors">
                                        Faire un ticket
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <p className="text-center text-white/60 text-sm pb-8 px-6">
                DROP TON PLATINE © {new Date().getFullYear()}. Tous droits réservés.
            </p>
        </footer>
    );
}

/** Filet bleu court, utilisé entre deux blocs d'une colonne. */
function Separator({ className = "" }: { className?: string }) {
    return <div className={`h-px w-36 bg-accent ${className}`} />;
}
