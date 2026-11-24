import LegalDocument, { type Article } from "@/components/LegalDocument";

/** Page « CGU ». Seul le texte vit ici, la forme est dans `LegalDocument`. */

const LAST_UPDATE = "8 novembre 2026";

const CONTACT_EMAIL = "assistance@dtp.com";

const ARTICLES: Article[] = [
    {
        title: "1. Présentation du site",
        blocks: [
            {
                kind: "text",
                content:
                    "Le site **www.droptonplatine.com** est une plateforme accessible via Internet qui propose un suivi des statistiques PSN, la possibilité d'interagir avec la communauté sous forme de commentaires, la mise à disposition de guides visant à aider les joueurs, un classement, des systèmes d'aide pour les joueurs, une plateforme sociale, des rédactions ainsi que des communiqués de presse.",
            },
            {
                kind: "text",
                content:
                    "Ce site est indépendant et **n'est pas affilié à Sony Interactive Entertainment.** L'utilisation du **PlayStation Network (PSN)** pour se connecter est soumise aux conditions de Sony.",
            },
        ],
    },
    {
        title: "2. Accès au site et authentification PSN",
        blocks: [
            { kind: "check", content: "Connexion avec PlayStation Network (PSN)" },
            {
                kind: "list",
                items: [
                    "L'accès au site nécessite une **connexion via votre compte PSN**.",
                    "L'authentification est gérée par Sony Interactive Entertainment. Nous **n'avons pas accès à vos identifiants de connexion**.",
                ],
            },
            { kind: "check", content: "Conditions d'accès" },
            {
                kind: "list",
                items: [
                    "Le site est accessible gratuitement.",
                    "Vous devez être âgé **d'au moins 7 ans** pour l'utiliser.",
                    "Vous devez posséder un **compte PlayStation Network valide**.",
                ],
            },
        ],
    },
    {
        title: "3. Utilisation du site",
        blocks: [
            { kind: "heading", content: "Ce que vous pouvez faire" },
            {
                kind: "list",
                items: [
                    "Naviguer librement sur le site",
                    "Consulter vos statistiques PlayStation",
                    "Interagir avec la communauté",
                ],
            },
            { kind: "heading", content: "Ce qui est interdit" },
            {
                kind: "list",
                items: [
                    "Usurper l'identité d'un autre utilisateur",
                    "Utiliser le site à des fins frauduleuses ou illégales",
                    "Publier du contenu haineux, offensant ou discriminatoire",
                    "Tenter de pirater ou perturber le fonctionnement du site",
                ],
            },
            {
                kind: "text",
                content:
                    "Le non-respect de ces règles peut entraîner **une suspension ou un bannissement** de votre accès.",
            },
        ],
    },
    {
        title: "4. Responsabilité",
        blocks: [
            { kind: "heading", content: "Notre responsabilité" },
            {
                kind: "list",
                items: [
                    "Nous faisons de notre mieux pour assurer le bon fonctionnement du site.",
                    "Nous ne sommes **pas responsables** des interruptions, bugs ou erreurs techniques.",
                    "Nous ne garantissons **pas l'exactitude des données récupérées via PlayStation Network** (ex. stats de jeux, classements, etc.).",
                ],
            },
            { kind: "heading", content: "Responsabilité de l'utilisateur" },
            {
                kind: "list",
                items: [
                    "Vous utilisez le site **sous votre propre responsabilité**.",
                    "Vous devez vous assurer que votre compte PSN est conforme aux règles de Sony.",
                ],
            },
        ],
    },
    {
        title: "5. Protection des données personnelles",
        blocks: [
            {
                kind: "text",
                content:
                    "Nous respectons votre vie privée. Les informations collectées via **PlayStation Network** sont utilisées uniquement pour vous fournir les services du site.",
            },
            {
                kind: "note",
                content: "Consultez notre [Politique de confidentialité](/confidentialite) pour en savoir plus.",
            },
        ],
    },
    {
        title: "6. Propriété intellectuelle",
        blocks: [
            {
                kind: "text",
                content:
                    "Tout le contenu du site **(logos, design, textes, code, etc.)** est protégé par le **droit d'auteur**. Vous ne pouvez pas le copier, le modifier ou le réutiliser sans autorisation.",
            },
            {
                kind: "text",
                content:
                    "Les marques **PlayStation, PSN et Sony** sont la propriété de **Sony Interactive Entertainment**. Ce site **n'est pas affilié à Sony**.",
            },
        ],
    },
    {
        title: "7. Modifications des CGU",
        blocks: [
            {
                kind: "text",
                content:
                    "Nous nous réservons le droit de modifier ces CGU à tout moment. La date de mise à jour sera indiquée en haut de cette page.",
            },
            {
                kind: "text",
                content: "En continuant d'utiliser le site après une mise à jour, vous acceptez les nouvelles conditions.",
            },
        ],
    },
    {
        title: "8. CONTACT",
        blocks: [
            {
                kind: "text",
                content: `**Contact** : Pour toute question, vous pouvez nous écrire à **${CONTACT_EMAIL}**.`,
            },
        ],
    },
];

export default function TermsPage() {
    return (
        <LegalDocument
            title="Conditions générales d'utilisation (CGU)"
            lastUpdate={LAST_UPDATE}
            intro="Bienvenue sur **www.droptonplatine.com**. En accédant et en utilisant notre site, vous acceptez les présentes Conditions Générales d'Utilisation **(CGU)**."
            articles={ARTICLES}
        />
    );
}
