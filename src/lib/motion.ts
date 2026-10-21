// Reactive `prefers-reduced-motion`, for JS that animates (canvas loops,
// programmatic scrolling). CSS keeps using the media query directly; this is
// the one JS reader, so nothing calls matchMedia for it again.
//
//   if (reducedMotion.current) { ...draw one still frame... }
//
// Inside an $effect or $derived it re-runs when the OS setting changes;
// elsewhere it reads the live value. SSR-safe: false on the server.

import { MediaQuery } from "svelte/reactivity";

class ReducedMotion {
    #mq = typeof window === "undefined" ? null : new MediaQuery("prefers-reduced-motion: reduce");

    get current(): boolean {
        return this.#mq?.current ?? false;
    }
}

export const reducedMotion = new ReducedMotion();
