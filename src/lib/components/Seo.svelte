<script lang="ts">
    import { page } from "$app/state";
    import { SITE_URL, SITE_NAME, OG } from "$lib/site";

    interface Props {
        title: string;
        description: string;
        /** Absolute URL to a preview image (OG size). Defaults to the page's
            generated card (/og/<last path segment or "index">.png, see
            $lib/server/og), so pages using <Seo> need an entry there. */
        image?: string;
        type?: "website" | "article";
        /** ISO date for articles, emitted as article:published_time. */
        publishedTime?: string;
    }

    let {
        title,
        description,
        image,
        type = "website",
        publishedTime,
    }: Props = $props();

    // Absolute canonical URL. During prerender `page.url.origin` is a
    // placeholder, so we build it from SITE_URL + the pathname instead.
    let canonical = $derived(SITE_URL + page.url.pathname);

    let ogImage = $derived(
        image ??
            `${SITE_URL}/og/${page.url.pathname.split("/").filter(Boolean).at(-1) ?? "index"}.png`,
    );
</script>

<svelte:head>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />

    <meta property="og:type" content={type} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:site_name" content={SITE_NAME} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content={String(OG.width * OG.scale)} />
    <meta property="og:image:height" content={String(OG.height * OG.scale)} />
    <meta property="og:image:alt" content={title} />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />

    {#if type === "article" && publishedTime}
        <meta property="article:published_time" content={publishedTime} />
    {/if}
</svelte:head>
