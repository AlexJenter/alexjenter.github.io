<script lang="ts">
    import PostGrid from "$lib/components/PostGrid.svelte";
    import Seo from "$lib/components/Seo.svelte";
    import { PAGES, SITE_NAME } from "$lib/site";

    let { data } = $props();
</script>

<Seo
    title="{SITE_NAME} — {PAGES.index.heading}"
    description={PAGES.index.description}
/>

<section class="page">
    <PostGrid posts={data.posts}>
        {#snippet intro()}
            <h1>I'm Alex Jenter, a frontend developer and creative coder.</h1>
            <p>
                This is my lab: experiments with graphics, generative art and
                interaction on the web. Most of them come with controls to
                play with.
            </p>
            <p>Client work is listed in my <a href="/resume">resume</a>.</p>
        {/snippet}
    </PostGrid>
</section>

<style>
    .page {
        padding: var(--space-24) var(--space-8) var(--space-16);
        max-width: var(--max-w-wide);
        margin: 0 auto;
    }

    h1 {
        font-size: var(--text-3xl);
        font-weight: 400;
        letter-spacing: -0.02em;
        line-height: var(--leading-tight);
        margin-bottom: var(--space-4);
    }

    p {
        color: var(--color-text-muted);
    }

    p + p {
        margin-top: var(--space-3);
    }
</style>
