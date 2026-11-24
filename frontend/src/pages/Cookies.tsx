import LegalDocument, { type Article } from "@/components/LegalDocument";

/** Page « Politique de cookies ». Seul le texte vit ici, la forme est dans `LegalDocument`. */

const LAST_UPDATE = "8 novembre 2026";

const CONTACT_EMAIL = "assistance@dtp.com";

const SONY_PRIVACY_URL = "https://www.playstation.com/fr-fr/legal/privacy-policy/";

const ARTICLES: Article[] = [
    {
        title: "1. Qu'est-ce qu'un cookie ?",
        blocks: [
            {
                kind: "text",
                content:
                    "Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, smartphone, tablette) lorsque vous visitez un site web. Il permet au site de fonctionner correctement et d'améliorer votre expérience utilisateur.",
            },
        ],
    },
    {
        title: "2. Quels cookies utilisons-nous ?",
        blocks: [
            {
                kind: "text",
                content:
                    "Notre site utilise uniquement **des cookies essentiels et des cookies tiers liés au PlayStation Network.**",
            },
            { kind: "heading", content: "Cookies strictement nécessaires" },
            { kind: "text", content: "Ces cookies sont indispensables au bon fonctionnement du site. Ils permettent :" },
            {
                kind: "list",
                items: [
                    "L'authentification via **PlayStation Network (PSN)**",
                    "La gestion des sessions utilisateur",
                    "La sécurité du site",
                ],
            },
            { kind: "heading", content: "Cookies PlayStation Network (tiers)" },
            {
                kind: "text",
                content:
                    "Lorsque vous vous connectez via **PlayStation Network**, Sony peut déposer ses propres cookies pour :",
            },
            {
                kind: "checklist",
                items: [
                    "Gérer l'authentification à votre compte PSN",
                    "Assurer la sécurité de la connexion",
                    "Mémoriser vos préférences PlayStation",
                ],
            },
            {
                kind: "text",
                content:
                    "Nous **n'avons aucun contrôle** sur ces cookies. Vous pouvez consulter la politique de confidentialité de Sony ici :",
            },
            {
                kind: "note",
                content: `[Politique de confidentialité de PlayStation](${SONY_PRIVACY_URL})`,
            },
        ],
    },
    {
        title: "3. Gestion des cookies",
        blocks: [
            { kind: "text", content: "Vous pouvez désactiver les cookies en :" },
            {
                kind: "list",
                items: [
                    "Modifiant les paramètres de votre navigateur (Chrome, Firefox, Edge, etc.)",
                    "Utilisant les options de gestion des cookies de votre appareil",
                ],
            },
            {
                kind: "text",
                content:
                    "**Attention** : Désactiver les cookies essentiels peut empêcher l'accès à certaines fonctionnalités, notamment la connexion via PSN.",
            },
        ],
    },
    {
        title: "4. Modifications de cette politique",
        blocks: [
            {
                kind: "text",
                content:
                    "Nous pouvons mettre à jour cette politique en fonction de l'évolution du site et des services PlayStation. La date de mise à jour sera indiquée en haut de cette page.",
            },
            {
                kind: "text",
                content: `**Contact** : Pour toute question, vous pouvez nous écrire à **${CONTACT_EMAIL}**.`,
            },
        ],
    },
];

export default function CookiesPage() {
    return (
        <LegalDocument
            title="Politique de cookies"
            lastUpdate={LAST_UPDATE}
            intro="Bienvenue sur **www.droptonplatine.com**. Cette politique de cookies explique ce que sont les cookies, comment nous les utilisons et comment vous pouvez les gérer."
            articles={ARTICLES}
        />
    );
}
