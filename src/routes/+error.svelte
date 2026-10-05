<script lang="ts">
    import { page } from "$app/state";
    import { SITE_NAME } from "$lib/site";

    const notFound = $derived(page.status === 404);
    const heading = $derived(notFound ? "Page not found" : "Something went wrong");
</script>

<svelte:head>
    <title>{heading} — {SITE_NAME}</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<section class="page">
    <h1>{heading}</h1>
    {#if notFound}
        <p>
            There's nothing at <code>{page.url.pathname}</code>. The link may be
            outdated, or the address mistyped.
        </p>
    {:else}
        <p>{page.error?.message ?? "The page failed to load."} ({page.status})</p>
    {/if}
    <p>Try the <a href="/">home page</a>.</p>
</section>

<style>
    .page {
        padding: var(--space-16) var(--space-8);
        max-width: var(--max-w-content);
        margin: 0 auto;
    }

    h1 {
        font-size: var(--text-4xl);
        font-weight: 400;
        letter-spacing: -0.02em;
        margin-bottom: var(--space-6);
    }

    p + p {
        margin-top: var(--space-3);
    }
</style>
