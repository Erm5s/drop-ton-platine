import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Remonte en haut de page à chaque changement de route.
 *
 * React Router conserve la position de défilement d'une navigation à l'autre : sans ça, un
 * lien cliqué en bas d'une longue page ouvre la suivante à la même hauteur, donc souvent au
 * milieu de nulle part. Une ancre `#section` est laissée tranquille, puisqu'elle vise
 * justement un endroit précis.
 */
export default function ScrollToTop() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (hash !== "") {
            return;
        }

        window.scrollTo({ top: 0, left: 0 });
    }, [pathname, hash]);

    return null;
}
