<script lang="ts">
    import type { Snippet } from "svelte";
    import Date from "$lib/components/Date.svelte";

    import type { Component } from "svelte";

    const heroModules = import.meta.glob("/src/routes/lab/**/Hero.svelte");

    interface Props {
        children: Snippet;
        data: {
            title?: string;
            date?: string;
            description?: string;
            slug?: string;
            hasHero?: boolean;
        };
    }

    let { children, data }: Props = $props();

    let Hero = $state<Component | null>(null);

    $effect(() => {
        if (!data.hasHero) {
            Hero = null;
            return;
        }
        const key = Object.keys(heroModules).find((k) =>
            k.includes(`/${data.slug}/Hero.svelte`),
        );
        if (key)
            heroModules[key]().then((m: any) => {
                Hero = m.default;
            });
    });

    // Scope root-level scroll snapping to hero posts only (home/resume keep
    // free scroll). The snap points live on the hero spacer + drawer.
    $effect(() => {
        const el = document.documentElement;
        if (data.hasHero) {
            el.classList.add("lab-post");
            return () => el.classList.remove("lab-post");
        }
    });
</script>

{#if data.hasHero}
    {#if Hero}<Hero />{:else}<div class="hero-placeholder"></div>{/if}
{/if}
<!-- opaque layer that scrolls up over the fixed hero backdrop -->
<div class="post-layer">
    <article class="post">
        <header>
            <h1>{data.title}</h1>
            <Date date={data.date} />
        </header>
        <div class="post-body">
            {@render children()}
        </div>
    </article>
</div>

<style>
    .hero-placeholder {
        height: 100lvh;
    }

    .post-layer {
        position: relative;
        z-index: 1;
        background: var(--color-bg);
        /* Own snap point so `mandatory` snapping doesn't yank clicks in the
           article back to the drawer. Being taller than the viewport, this is a
           large snap area — you can rest anywhere within it. */
        scroll-snap-align: start;
    }

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

    /* Styled tooltips for link titles: [text](url "title").
       The rehype-link-tooltips plugin turns the title into a .link-tip span. */
    .post :global(a.has-tip) {
        position: relative;
    }

    .post :global(a.has-tip .link-tip) {
        position: absolute;
        left: 50%;
        bottom: calc(100% + var(--space-2));
        z-index: 10;
        transform: translateX(-50%) translateY(4px);

        width: max-content;
        max-width: min(22rem, 60vw);
        padding: var(--space-2) var(--space-3);

        background: var(--color-text);
        color: var(--color-bg);
        border-radius: var(--radius-md);

        font-size: var(--text-sm);
        line-height: var(--leading-normal);
        text-align: left;
        text-decoration: none;
        text-wrap: pretty;

        opacity: 0;
        pointer-events: none;
        transition:
            opacity var(--duration-fast) var(--ease-out),
            transform var(--duration-fast) var(--ease-out);
    }

    /* little pointer under the bubble */
    .post :global(a.has-tip .link-tip)::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: var(--color-text);
    }

    .post :global(a.has-tip:hover .link-tip),
    .post :global(a.has-tip:focus-visible .link-tip) {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }

    @media (prefers-reduced-motion: reduce) {
        .post :global(a.has-tip .link-tip) {
            transition: none;
        }
    }
</style>
