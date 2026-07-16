<script lang="ts">
    import { page } from "$app/state";
    import { SITE_URL, SITE_NAME } from "$lib/site";

    interface Props {
        title: string;
        description: string;
        /** Absolute URL to a preview image. Omitted for now (see plan). */
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
    {#if image}
        <meta property="og:image" content={image} />
    {/if}

    <meta
        name="twitter:card"
        content={image ? "summary_large_image" : "summary"}
    />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    {#if image}
        <meta name="twitter:image" content={image} />
    {/if}

    {#if type === "article" && publishedTime}
        <meta property="article:published_time" content={publishedTime} />
    {/if}
</svelte:head>
