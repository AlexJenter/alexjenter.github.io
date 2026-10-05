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

/** Profile links in the site footer. */
export const PROFILES = [
  { label: "GitHub", href: "https://github.com/AlexJenter" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jenteralex/" },
];

/** OG preview cards: laid out at 1200×630, rendered at 2× for crisp previews. */
export const OG = { width: 1200, height: 630, scale: 2 };

/**
 * Headings and descriptions of the pages that aren't posts, keyed by their
 * OG image slug — shared by each page's <Seo> and its generated preview card
 * (see $lib/server/og). Posts take theirs from frontmatter.
 */
export const PAGES = {
  index: {
    heading: "Frontend dev & creative coder",
    description:
      "Frontend developer and creative coder building interfaces and experiments on the web.",
  },
  lab: {
    heading: "Lab",
    description:
      "Experiments in graphics, generative art, and interaction on the web.",
  },
  resume: {
    heading: "Resume",
    description:
      "Résumé of Alex Jenter — web developer with a background in design.",
  },
};
