// Single reactive source of truth for the light/dark theme.
//
// Wraps the platform primitives it doesn't own — `data-theme` on <html>,
// `prefers-color-scheme`, and localStorage — rather than replacing them: CSS
// still drives every visual (see tokens.css) and the FOUC script in app.html
// still applies the stored theme before paint. This module just mirrors that
// state reactively so JS consumers (e.g. canvas renderers) can read a single
// resolved value instead of re-deriving it from matchMedia.

export type Theme = "light" | "dark";
export type Preference = Theme | "system";

const STORAGE_KEY = "theme";

function isTheme(value: unknown): value is Theme {
    return value === "light" || value === "dark";
}

class ThemeStore {
    /** The user's choice; "system" follows the OS. */
    preference = $state<Preference>("system");

    /** Mirrors the OS media query so `resolved` reacts to OS changes. */
    #systemDark = $state(false);

    /** The theme actually in effect: an explicit override wins, else the OS. */
    resolved: Theme = $derived(
        this.preference === "system"
            ? this.#systemDark
                ? "dark"
                : "light"
            : this.preference,
    );

    constructor() {
        if (typeof window === "undefined") return; // SSR-safe: stays "system"/light.

        const stored = localStorage.getItem(STORAGE_KEY);
        this.preference = isTheme(stored) ? stored : "system";

        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        this.#systemDark = mq.matches;
        mq.addEventListener("change", (e) => (this.#systemDark = e.matches));
    }

    set(pref: Preference) {
        this.preference = pref;
        if (pref === "system") {
            // Clear the override so CSS falls back to prefers-color-scheme.
            localStorage.removeItem(STORAGE_KEY);
            delete document.documentElement.dataset.theme;
        } else {
            localStorage.setItem(STORAGE_KEY, pref);
            document.documentElement.dataset.theme = pref;
        }
    }

    /**
     * Flip to the opposite of what's currently showing. Collapses back to
     * "system" whenever the target matches the OS, so we keep following the OS
     * whenever possible — and every click always makes a visible change.
     */
    toggle() {
        const systemTheme: Theme = this.#systemDark ? "dark" : "light";
        const target: Theme = this.resolved === "dark" ? "light" : "dark";
        this.set(target === systemTheme ? "system" : target);
    }
}

export const theme = new ThemeStore();
