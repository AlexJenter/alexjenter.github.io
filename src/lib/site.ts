import { env } from "$env/dynamic/public";

/**
 * Absolute site origin, normalized without a trailing slash so it can be
 * concatenated with `page.url.pathname` (e.g. `${SITE_URL}/lab`).
 *
 * Read from PUBLIC_SITE_URL (set in `.env` locally and in the deploy workflow),
 * with a hardcoded fallback so builds never break when the gitignored `.env`
 * is absent — e.g. a fresh clone or CI without the env configured.
 */
export const SITE_URL = (
  env.PUBLIC_SITE_URL || "https://alexjenter.github.io"
).replace(/\/+$/, "");

/** Site-wide name used for `og:site_name` and title suffixes. */
export const SITE_NAME = "Alex Jenter";
