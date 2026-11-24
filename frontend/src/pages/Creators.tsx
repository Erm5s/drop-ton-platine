import { Link } from "react-router-dom";
import { SocialIcon, SOCIAL_LABELS, type SocialName } from "@/lib/socialIcons";

/**
 * Page « Créateurs » : les personnes qui soutiennent publiquement Drop Ton Platine.
 *
 * Le contenu est pour l'instant écrit en dur. Il n'existe aucune table en base pour les
 * créateurs : tant qu'ils se comptent sur les doigts d'une main, un tableau ici est plus
 * simple à maintenir qu'une administration.
 */

type Creator = {
    slug: string;
    name: string;
    /** Image ronde affichée dans la rangée du haut et sur la bannière. */
    avatarUrl: string;
    /** Bannière de chaîne, en fond de la fiche. */
    bannerUrl?: string;
    /** Identifiant d'une vidéo YouTube à mettre en avant. */
    videoId?: string;
    socials: { name: SocialName; href: string }[];
};

const CREATORS: Creator[] = [
    {
        slug: "deherkah",
        name: "Deherkah",
        avatarUrl: "/images/creators/pdp.png",
        bannerUrl: "/images/creators/pdp.png",
        videoId: "dQw4w9WgXcQ",
        socials: [
            { name: "youtube", href: "https://www.youtube.com/@Deherkah" },
            { name: "instagram", href: "https://www.instagram.com/deherkah" },
            { name: "twitch", href: "https://www.twitch.tv/deherkah" },
            { name: "tiktok", href: "https://www.tiktok.com/@deherkah" },
            { name: "x", href: "https://x.com/deherkah" },
            { name: "facebook", href: "https://www.facebook.com/deherkah" },
        ],
    },
    {
        slug: "imxbaddack",
        name: "imxbaddack",
        avatarUrl: "/images/creators/pdp.png",
        socials: [
            { name: "youtube", href: "https://www.youtube.com/@imxbaddack" },
            { name: "x", href: "https://x.com/imxbaddack" },
        ],
    },
    {
        slug: "kemet",
        name: "Kemet",
        avatarUrl: "/images/creators/pdp.png",
        socials: [
            { name: "youtube", href: "https://www.youtube.com/@kemet" },
            { name: "twitch", href: "https://www.twitch.tv/kemet" },
        ],
    },
];

/**
 * Fait défiler jusqu'à la fiche d'un créateur, en douceur et en la centrant.
 *
 * `scrollIntoView` plutôt qu'une ancre `#slug` : l'ancre saute d'un coup et aligne la fiche
 * en haut, sous la barre de navigation. Le réglage système « animations réduites » est
 * respecté, auquel cas le saut direct est conservé.
 */
function scrollToCreator(slug: string) {
    const section = document.getElementById(slug);
    if (!section) {
        return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
}

export default function CreatorsPage() {
    return (
        <div className="bg-white pt-10">
            <div className="px-6 py-14 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-navy-dark uppercase">
                    Ils soutiennent Drop Ton Platine<sup className="text-xl">®</sup>
                </h1>
                <p className="font-bold text-navy-dark mt-4">Regardez leur travail !</p>
                <p className="italic text-navy-dark mt-1">
                    Envie de nous soutenir publiquement ?{" "}
                    <Link to="/ticket" className="text-blue italic underline">
                        Contactez-nous ici
                    </Link>{" "}
                    !
                </p>

                {/* Rangée d'avatars : un raccourci vers la fiche correspondante */}
                <div className="flex flex-wrap items-start justify-center gap-10 mt-12">
                    {CREATORS.map((creator) => (
                        <button
                            key={creator.slug}
                            type="button"
                            onClick={() => scrollToCreator(creator.slug)}
                            className="group w-40 cursor-pointer"
                        >
                            <Avatar creator={creator} className="w-40 h-40 mx-auto" />
                            <span className="inline-block mt-4 px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm italic font-bold text-navy-dark group-hover:border-accent transition-colors">
                                {creator.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                {CREATORS.map((creator, index) => (
                    // Le biais s'inverse d'une fiche à l'autre, pour casser la répétition
                    <CreatorShowcase key={creator.slug} creator={creator} flipped={index % 2 === 1} />
                ))}
            </div>
        </div>
    );
}

/** Image ronde du créateur, avec un cercle neutre en secours. */
function Avatar({ creator, className }: { creator: Creator; className: string }) {
    return (
        <img
            src={creator.avatarUrl}
            alt={creator.name}
            className={`${className} rounded-full object-cover bg-navy border-2 border-white shadow`}
            onError={(event) => {
                event.currentTarget.style.visibility = "hidden";
            }}
        />
    );
}

/**
 * Fiche d'un créateur : la bannière occupe tout le fond, un panneau navy la recouvre en biais
 * sur la droite, et la vidéo se pose par-dessus.
 *
 * Les deux plans se chevauchent au lieu d'être côte à côte : la bannière continue sous le
 * panneau, seule la diagonale marque la séparation.
 */
function CreatorShowcase({ creator, flipped }: { creator: Creator; flipped: boolean }) {
    // La diagonale oscille entre 54 % et 41 % de la largeur, en s'inversant d'une fiche à
    // l'autre : le bas de l'une rejoint donc exactement le haut de la suivante.
    const clipPath = flipped
        ? "polygon(41% 0, 100% 0, 100% 100%, 54% 100%)"
        : "polygon(54% 0, 100% 0, 100% 100%, 41% 100%)";

    return (
        <section id={creator.slug} className="relative overflow-hidden bg-navy-dark scroll-mt-6">
            {/* Fond : la bannière du créateur, sur toute la largeur */}
            {creator.bannerUrl && (
                <img
                    src={creator.bannerUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(event) => {
                        event.currentTarget.style.display = "none";
                    }}
                />
            )}
            <div className="absolute inset-0 bg-navy/50" />

            {/* Panneau navy en biais, posé par-dessus la bannière */}
            <div className="absolute inset-0 bg-navy-dark" style={{ clipPath }} />

            <div className="relative flex flex-col lg:flex-row items-center gap-8 px-8 py-12">
                {/* Identité du créateur, côté bannière */}
                <div className="lg:w-[45%] flex flex-col items-center shrink-0">
                    <Avatar creator={creator} className="w-40 h-40" />
                    <p className="text-white text-2xl font-bold mt-3 drop-shadow">{creator.name}</p>

                    <div className="flex items-center gap-4 mt-4 px-5 py-2.5 bg-[#FF0000] rounded-full">
                        {creator.socials.map(({ name, href }) => (
                            <a
                                key={name}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`${creator.name} sur ${SOCIAL_LABELS[name]}`}
                                title={SOCIAL_LABELS[name]}
                                className="text-white transition-opacity hover:opacity-70"
                            >
                                <SocialIcon name={name} className="w-6 h-6" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Vidéo dans son encadré blanc, côté panneau */}
                <div className="lg:w-[55%] w-full bg-white rounded p-2 shadow-lg">
                    {creator.videoId ? (
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${creator.videoId}?rel=0&modestbranding=1`}
                            title={`Vidéo de ${creator.name}`}
                            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                            allowFullScreen
                            className="w-full aspect-video block"
                        />
                    ) : (
                        <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">Aucune vidéo mise en avant</span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
