/**
 * Bandeau de titre posé au-dessus d'une liste (catalogue, classement…).
 *
 * Même dégradé que la bannière de profil, pour que les pages de listes se reconnaissent
 * entre elles.
 */
export default function SectionBanner({ children }: { children: React.ReactNode }) {
    return (
        <h2
            className="text-center text-white text-xl font-semibold py-3 mb-4"
            style={{ background: "linear-gradient(360deg, var(--color-navy-dark), var(--color-navy))" }}
        >
            {children}
        </h2>
    );
}
