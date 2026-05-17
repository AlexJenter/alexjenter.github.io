<script lang="ts">
    import type { Snippet } from "svelte";
    import Date from "$lib/components/Date.svelte";

    import type { Component } from "svelte";

    const heroModules = import.meta.glob('/src/routes/blog/**/Hero.svelte');

    interface Props {
        children: Snippet;
        data: { title?: string; date?: string; description?: string; slug?: string; hasHero?: boolean };
    }

    let { children, data }: Props = $props();

    let Hero = $state<Component | null>(null);

    $effect(() => {
        if (!data.hasHero) { Hero = null; return; }
        const key = Object.keys(heroModules).find((k) => k.includes(`/${data.slug}/Hero.svelte`));
        if (key) heroModules[key]().then((m: any) => { Hero = m.default; });
    });
</script>

<article class="post">
    {#if Hero}<Hero />{/if}
    <header>
        <h1>{data.title}</h1>
        <Date date={data.date} />
    </header>
    <div class="post-body">
        {@render children()}
    </div>
</article>

<style>
    header {
        margin-bottom: var(--space-12);
        padding: 0 var(--space-8);
    }

    .post {
        padding-top: var(--space-16);
        padding-bottom: var(--space-16);
        max-width: var(--max-w-content);
        margin: 0 auto;
    }

    .post-body {
        padding: 0 var(--space-8);
    }

    .post :global(h1) {
        font-size: var(--text-4xl);
        font-weight: 400;
        letter-spacing: -0.02em;
        margin-bottom: var(--space-3);
    }

    .post :global(h2) {
        font-size: var(--text-2xl);
        font-weight: 400;
        letter-spacing: -0.01em;
        margin-top: var(--space-12);
        margin-bottom: var(--space-4);
    }

    .post :global(h3) {
        font-size: var(--text-xl);
        font-weight: 400;
        margin-top: var(--space-8);
        margin-bottom: var(--space-3);
    }

    .post :global(p) {
        margin-bottom: var(--space-4);
    }

    .post :global(ul),
    .post :global(ol) {
        padding-left: var(--space-6);
        margin-bottom: var(--space-4);
    }

    .post :global(li) {
        margin-bottom: var(--space-2);
    }

    .post :global(hr) {
        border: none;
        border-top: 1px solid var(--color-border);
        margin: var(--space-12) 0;
    }

    .post :global(img) {
        max-width: 100%;
        border-radius: var(--radius-md);
    }

    .post :global(blockquote) {
        font-size: var(--text-xl);
        padding-inline-start: 15px;
        border-inline-start: 5px solid whitesmoke;
    }
</style>
