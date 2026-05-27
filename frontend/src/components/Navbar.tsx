import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

type DropdownItem = { label: string; href: string };
type NavItem = { label: string; href?: string; dropdown?: DropdownItem[] };

const navItems: NavItem[] = [
    { label: "Accueil", href: "/" },
    { label: "Jeux", href: "/jeux" },
    {
        label: "Entraide",
        dropdown: [
            { label: "Guides", href: "/guides" },
            { label: "Crew", href: "/crew" },
            { label: "Boost", href: "/boost" },
            { label: "Helper", href: "/helper" },
        ],
    },
    {
        label: "Articles",
        dropdown: [
            { label: "Nos tests", href: "/tests" },
            { label: "Communiqués de presse", href: "/communiques" },
        ],
    },
    {
        label: "Outils",
        dropdown: [
            { label: "Fermetures de serveurs", href: "/fermetures" },
            { label: "Platines impossibles", href: "/impossibles" },
        ],
    },
    { label: "Classement", href: "/classement" },
    { label: "PS Plus", href: "/psplus" },
    {
        label: "Social",
        dropdown: [
            { label: "Partenaires", href: "/partenaires" },
            { label: "Créateurs", href: "/createurs" },
        ],
    },
];

export default function Navbar() {
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        const trimmed = search.trim();
        if (trimmed) navigate(`/${trimmed}`);
    }

    return (
        <header
            className="flex items-center w-full px-4 shrink-0"
            style={{
                height: "125px",
                background: "linear-gradient(360deg, var(--color-navy-dark) 0%, var(--color-navy) 100%)",
            }}
        >
            {/* Logo */}
            <div className="w-[20%] flex items-center ml-4">
                <Link to="/">
                    <img src="/images/name_logo.png" alt="Drop Ton Platine" className="h-18 w-auto" />
                </Link>
            </div>

            {/* Centre : recherche + navigation */}
            <div className="w-[60%] flex flex-col items-center gap-4">
                {/* Barre de recherche */}
                <form onSubmit={handleSearch} className="relative w-3/5">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Chercher un joueur, un jeu..."
                        className="w-full h-9 rounded-[10px] border-none pl-6 pr-10 text-sm text-black outline-none bg-white"
                    />
                    <button
                        type="submit"
                        className="absolute right-0.5 top-0 h-9 bg-transparent border-none px-2 cursor-pointer"
                    >
                        <img src="/icons/search.png" alt="Rechercher" className="w7 h-7" />
                    </button>
                </form>

                {/* Navigation */}
                <nav>
                    <ul className="flex list-none p-0 m-0">
                        {navItems.map((item) => (
                            <li key={item.label} className="relative group">
                                {item.href ? (
                                    <Link
                                        to={item.href}
                                                        className="text-white no-underline uppercase font-medium text-[1.1em] px-4 py-1
                                                   hover:text-accent transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span
                                        className="text-white uppercase font-medium text-[1.1em] px-4 py-1 cursor-pointer
                                                   hover:text-accent transition-colors"
                                    >
                                        {item.label}
                                    </span>
                                )}

                                {item.dropdown && (
                                    <ul
                                        className="hidden group-hover:block absolute top-full left-0 list-none p-0 m-0
                                                   min-w-[280px] z-50 shadow-lg"
                                        style={{
                                            background: "linear-gradient(180deg, var(--color-navy-dark) 0%, var(--color-navy) 100%)",
                                        }}
                                    >
                                        <li className="px-6 pt-6 pb-2">
                                            <hr className="border-white border-t" />
                                        </li>
                                        {item.dropdown.map((sub) => (
                                            <li key={sub.label} className="py-3 px-6">
                                                <Link
                                                    to={sub.href}
                                                    className="text-white no-underline uppercase text-sm font-medium
                                                               hover:text-accent transition-colors"
                                                >
                                                    {sub.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {/* Droite : connexion */}
            <div className="w-[20%] flex items-center justify-end pr-4">
                <Link
                    to="/connexion"
                    className="text-white no-underline font-bold uppercase text-[1.1em] px-4 py-3
                               rounded-[10px] border-[3px] border-blue bg-blue
                               hover:bg-white hover:text-blue transition-colors"
                >
                    Connexion
                </Link>
            </div>
        </header>
    );
}
