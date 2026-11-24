import { useEffect } from "react";
import { Link } from "react-router-dom";

/**
 * Page « Partenaires » : un bandeau pleine largeur par partenaire.
 *
 * Deux mises en page cohabitent, choisies par les données plutôt que par un réglage :
 *   - un visuel plein cadre, le logo posé dessus (PlayStation)
 *   - la couleur de la marque à gauche, son illustration à droite séparée en biais (Red Art)
 *
 * Le contenu est écrit en dur : tant que la liste tient en quelques entrées, ce tableau se
 * modifie plus vite qu'une interface d'administration.
 */

type PartnerLink = {
    label: string;
    href: string;
    /** Petite icône affichée dans le bouton, facultative. */
    iconUrl?: string;
};

type Partner = {
    slug: string;
    name: string;
    /** Logo du partenaire, prévoir une version claire : il se pose sur un fond sombre. */
    logoUrl: string;
    links: PartnerLink[];
    /** Couleur vive des boutons, propre à la marque. */
    accentColor?: string;
    /**
     * Version sourde de la même teinte, pour le fond du bandeau. Elle sépare les partenaires
     * sans écraser l'illustration ni concurrencer les boutons.
     */
    brandColor?: string;
    /** Remise réservée aux visiteurs, affichée sous les boutons. */
    promo?: { text: string; code: string };
    /** Illustration de la moitié droite, découpée en biais. */
    artworkUrl?: string;
};

const PARTNERS: Partner[] = [
    {
        slug: "playstation",
        name: "PlayStation",
        logoUrl: "/images/partners/playstation-logo.png",
        artworkUrl: "/images/partners/playstation-bg.png",
        accentColor: "#00A3FF",
        brandColor: "#0A3D62",
        links: [
            { label: "Communiqués", href: "/communiques" },
            { label: "Site officiel", href: "https://www.playstation.com/fr-fr/" },
            {
                label: "PlayStation® Store",
                href: "https://store.playstation.com/fr-fr/",
                iconUrl: "/images/partners/psstore.png",
            },
        ],
    },
    {
        slug: "red-art-games",
        name: "Red Art Games",
        logoUrl: "/images/partners/redartgames-logo.png",
        artworkUrl: "/images/partners/redartgames-art.png",
        accentColor: "#FF2D55",
        brandColor: "#7A1F3D",
        links: [{ label: "Site officiel", href: "https://redartgames.com" }],
        promo: { text: "-10% sur le site avec le code", code: "DROPTONPLATINE" },
    },
    {
        slug: "square-enix",
        name: "Square Enix",
        logoUrl: "/images/partners/squareenix-logo.png",
        artworkUrl: "/images/partners/squareenix-bg.png",
        accentColor: "#7B2FF7",
        brandColor: "#3B1F6B",
        links: [
            { label: "Communiqués", href: "/communiques" },
            { label: "Site officiel", href: "https://www.square-enix-games.com/fr_FR/home" },
        ],
    },
    {
        slug: "ubisoft",
        name: "Ubisoft",
        logoUrl: "/images/partners/ubisoft-logo.png",
        artworkUrl: "/images/partners/ubisoft-bg.png",
        accentColor: "#00C853",
        brandColor: "#1B5E3F",
        links: [
            { label: "Communiqués", href: "/communiques" },
            { label: "Site officiel", href: "https://www.ubisoft.com/fr-fr/" },
        ],
    },
];

export default function PartnersPage() {
    // L'aimantation vit sur <html> : on la retire en quittant la page, sinon elle
    // s'appliquerait au reste du site.
    useEffect(() => {
        document.documentElement.classList.add("snap-sections");
        return () => document.documentElement.classList.remove("snap-sections");
    }, []);

    return (
        <div className="relative bg-white">
            {/* Carte de titre, posée par-dessus le premier bandeau */}
            <div className="absolute top-10 inset-x-0 z-10 flex justify-center px-6">
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl px-10 py-6 text-center">
                    <h1 className="text-2xl md:text-4xl font-bold text-navy-dark uppercase">
                        Les partenaires de Drop Ton Platine<sup className="text-xl">®</sup>
                    </h1>
                    <p className="text-navy-dark mt-3">Merci à eux pour le soutien !</p>
                </div>
            </div>

            {PARTNERS.map((partner, index) => (
                // Le premier bandeau passe sous la carte de titre : il lui faut de la hauteur
                <PartnerBanner key={partner.slug} partner={partner} first={index === 0} />
            ))}

            {/* Appel à candidature, en bas de page */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 px-6 py-16">
                <img
                    src="/images/main_logo.png"
                    alt="Drop Ton Platine"
                    className="w-40 h-40 object-contain shrink-0"
                />
                <div className="text-center">
                    <p className="text-2xl font-bold text-navy-dark">Vous souhaitez devenir partenaire ?</p>
                    <p className="text-2xl font-bold text-navy-dark mt-3">
                        Contactez-nous{" "}
                        <Link to="/ticket" className="text-accent underline">
                            ici
                        </Link>{" "}
                        !
                    </p>
                </div>
            </div>
        </div>
    );
}

function PartnerBanner({ partner, first }: { partner: Partner; first: boolean }) {
    // Dégage la place occupée par la carte de titre, qui flotte au-dessus du premier bandeau
    const height = first ? "min-h-[44rem]" : "min-h-[34rem]";
    const topPadding = first ? "pt-56" : "pt-20";
    const accent = partner.accentColor ?? "#E60012";
    const background = partner.brandColor ?? accent;

    return (
        <section
            id={partner.slug}
            className={`snap-section relative ${height} overflow-hidden`}
            style={{ backgroundColor: background }}
        >
            {partner.artworkUrl && (
                <img
                    src={partner.artworkUrl}
                    alt=""
                    className="absolute inset-y-0 right-0 w-full md:w-[62%] h-full object-cover"
                    style={{ clipPath: "polygon(26% 0, 100% 0, 100% 100%, 0 100%)" }}
                    onError={(event) => {
                        event.currentTarget.style.display = "none";
                    }}
                />
            )}

            <div className={`relative flex items-center ${height} px-8 md:w-[45%] pb-20 ${topPadding}`}>
                <div className="flex flex-col items-center w-full">
                    <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="h-24 w-auto object-contain"
                        onError={(event) => {
                            event.currentTarget.replaceWith(
                                Object.assign(document.createElement("p"), {
                                    className: "text-white text-3xl font-bold",
                                    textContent: partner.name,
                                }),
                            );
                        }}
                    />

                    <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-sm">
                        {partner.links.map((link) => (
                            <PartnerButton key={link.href} link={link} color={accent} />
                        ))}
                    </div>

                    {partner.promo && (
                        <div className="mt-8 text-center text-white">
                            <p className="text-xl">{partner.promo.text}</p>
                            <p className="text-xl font-bold italic mt-1">{partner.promo.code}</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

/** Bouton d'un partenaire. Un lien interne reste géré par le routeur. */
function PartnerButton({ link, color }: { link: PartnerLink; color?: string }) {
    // Aplat vif sur un fond sourd : c'est le contraste entre les deux qui fait ressortir
    const className =
        "inline-flex items-center gap-2 text-white text-sm font-bold uppercase px-5 py-3 rounded-md shadow transition-opacity hover:opacity-85";
    const style = { backgroundColor: color ?? "#E60012" };

    const content = (
        <>
            {link.iconUrl && <img src={link.iconUrl} alt="" className="w-5 h-5 object-contain" />}
            {link.label}
        </>
    );

    return link.href.startsWith("/") ? (
        <Link to={link.href} className={className} style={style}>
            {content}
        </Link>
    ) : (
        <a href={link.href} target="_blank" rel="noreferrer" className={className} style={style}>
            {content}
        </a>
    );
}
