<script lang="ts">
    import type { Snippet } from "svelte";
    import Date from "$lib/components/Date.svelte";
    import Seo from "$lib/components/Seo.svelte";

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

    // Only one scroller live at a time: the hero's scroller takes gestures
    // only while the page is at its very top (see .hero-scroller.locked).
    let scrollY = $state(0);
</script>

<svelte:window bind:scrollY />

<Seo
    title={data.title ? `${data.title} — Alex Jenter` : "Alex Jenter"}
    description={data.description ??
        "An experiment from Alex Jenter's lab — graphics, generative art, and interaction on the web."}
    type="article"
    publishedTime={data.date}
/>

{#if data.hasHero}
    <!-- Server-rendered at a known height, so the article's position never
         depends on the hero chunk or its drawer. The hero renders a sticky
         .hero-stage plus its <Drawer> into the scroller. -->
    <div class="hero-shell">
        <div class="hero-scroller" class:locked={scrollY > 0}>
            {#if Hero}<Hero />{/if}
        </div>
    </div>
{/if}
<!-- opaque layer that scrolls up over the pinned hero -->
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

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    /* Pinned like a fixed backdrop: sticky for the whole of <main>, while the
       .post-layer (z-index 1) slides up over it. svh, not dvh/lvh: the mobile
       URL bar showing/hiding never resizes it, so canvases don't reset. */
    .hero-shell {
        position: sticky;
        top: 0;
        height: 100svh;
        z-index: 0;
    }

    /* The hero's own scroller: a gesture that starts over the hero scrolls
       this until the drawer is revealed and stops there (browsers latch a
       gesture to one scroller); the next gesture scrolls the page. Replaces
       scroll-snap. No scrollbar — the drawer itself is the affordance. */
    .hero-scroller {
        height: 100%;
        overflow-y: auto;
        scrollbar-width: none;
    }

    .hero-scroller::-webkit-scrollbar {
        display: none;
    }

    /* Once the page has moved off the top, the hero's scroller locks: overflow
       hidden keeps its position (drawer stays as it was) but takes no
       wheel/touch, so a gesture over the visible hero scrolls the page. Order
       is always page ↔ drawer ↔ hero. */
    .hero-scroller.locked {
        overflow-y: hidden;
    }

    .post-layer {
        position: relative;
        z-index: 1;
        background: var(--color-bg);
        overflow: clip;
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
        @include m.prose-h1;
    }

    .post :global(h2) {
        @include m.prose-h2;
    }

    .post :global(h3) {
        @include m.prose-h3;
    }

    .post :global(h4) {
        @include m.prose-h4;
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
