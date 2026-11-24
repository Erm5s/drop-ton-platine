/**
 * Tracés SVG des réseaux sociaux, partagés entre le pied de page et la page créateurs.
 *
 * Monochromes et sans dimension propre : la couleur vient de `currentColor` et la taille
 * de la classe appliquée, ce qui permet de les réutiliser dans n'importe quel contexte.
 */

export type SocialName = "youtube" | "instagram" | "twitch" | "tiktok" | "x" | "facebook" | "discord";

export const SOCIAL_PATHS: Record<SocialName, string> = {
    youtube:
        "M23 12s0-3.3-.4-4.9a2.6 2.6 0 0 0-1.8-1.8C19.2 5 12 5 12 5s-7.2 0-8.8.4a2.6 2.6 0 0 0-1.8 1.8C1 8.7 1 12 1 12s0 3.3.4 4.9c.2.9.9 1.6 1.8 1.8 1.6.3 8.8.3 8.8.3s7.2 0 8.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.5.4-4.8.4-4.8ZM9.7 15.1V8.9l6 3.1-6 3.1Z",
    instagram:
        "M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.8-.1Zm0 5.1a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.8a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z",
    twitch:
        "M4.3 2 2.5 6.4v14.1h5v3h3l3-3h4L22.5 18V2H4.3Zm16.2 15-3 3h-5l-3 3v-3h-4V3.5h15V17Zm-4.5-8.7v5.2h-1.7V8.3h1.7Zm-4.5 0v5.2H9.8V8.3h1.7Z",
    tiktok:
        "M16.6 2h-3.1v13.6a2.6 2.6 0 1 1-2.6-2.6c.2 0 .5 0 .7.1v-3.2a6 6 0 0 0-.7 0 5.8 5.8 0 1 0 5.8 5.8V8.9a7 7 0 0 0 4.1 1.3V7a4 4 0 0 1-4.2-5Z",
    x: "M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.5L6.3 22H3.2l7.3-8.4L2.8 2h6.4l4.5 5.9L18.9 2Zm-1.1 18h1.7L8.3 3.7H6.5L17.8 20Z",
    facebook:
        "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z",
    discord:
        "M19.3 5.3A16 16 0 0 0 15.4 4l-.3.5a12 12 0 0 1 3.4 1.7 11 11 0 0 0-9-.4l-.5.4A12 12 0 0 1 12.5 4L12.2 4a16 16 0 0 0-3.9 1.3C5.8 9 5.1 12.6 5.4 16.1a16 16 0 0 0 4.8 2.4l.9-1.4c-.5-.2-1-.4-1.5-.7l.4-.3a11 11 0 0 0 9.4 0l.4.3c-.5.3-1 .5-1.5.7l.9 1.4a16 16 0 0 0 4.8-2.4c.4-4-.7-7.6-2.7-10.8ZM9.9 14.2c-.9 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Zm4.9 0c-.9 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Z",
};

export const SOCIAL_LABELS: Record<SocialName, string> = {
    youtube: "YouTube",
    instagram: "Instagram",
    twitch: "Twitch",
    tiktok: "TikTok",
    x: "X",
    facebook: "Facebook",
    discord: "Discord",
};

export function SocialIcon({ name, className = "w-6 h-6" }: { name: SocialName; className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d={SOCIAL_PATHS[name]} />
        </svg>
    );
}
