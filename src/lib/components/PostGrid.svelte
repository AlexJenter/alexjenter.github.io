<script lang="ts">
    import type { Snippet } from "svelte";
    import type { PostSummary } from "$lib";
    import Date from "./Date.svelte";

    interface Props {
        /** newest first; the first one gets the big tile */
        posts: PostSummary[];
        /** an optional first tile, e.g. the home page's introduction */
        intro?: Snippet;
    }

    let { posts, intro }: Props = $props();
</script>

<div class="grid">
    {#if intro}
        <div class="intro">{@render intro()}</div>
    {/if}
    <!-- display: contents lets the items sit in the grid beside the intro;
         role="list" keeps the list semantics that it and list-style: none
         would drop in Safari. Covers are decorative inside a link that
         already carries the title, hence alt="". -->
    <ol role="list">
        {#each posts as post, i (post.slug)}
            <!-- the first tiles are in view on load (tablet and up); the
                 rest wait until the reader scrolls near them -->
            {@const loading = i < 3 ? "eager" : "lazy"}
            <li class:featured={i === 0}>
                <a href="/lab/{post.slug}">
                    <div class="cover">
                        {#if post.cover && !post.cover.enhanced}
                            <img
                                src={post.cover.src}
                                alt=""
                                class:pixelated={post.cover.pixelated}
                                {loading}
                                fetchpriority={i === 0 ? "high" : undefined}
                            />
                        {:else if post.cover}
                            <enhanced:img
                                src={post.cover.src}
                                alt=""
                                {loading}
                                fetchpriority={i === 0 ? "high" : undefined}
                                sizes={i === 0
                                    ? "(min-width: 75rem) 760px, (min-width: 48rem) 66vw, 100vw"
                                    : "(min-width: 75rem) 370px, (min-width: 48rem) 33vw, 50vw"}
                            />
                        {/if}
                    </div>
                    <h2><span>{post.title}</span></h2>
                    {#if i === 0 && post.description}
                        <p>{post.description}</p>
                    {/if}
                    <Date date={post.date} />
                </a>
            </li>
        {/each}
    </ol>
</div>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    @mixin marker-on {
        color: var(--color-bg);
        background-size: 100% 100%;

        /* Entering: the text flips late, once the bar covers it. */
        @media (prefers-reduced-motion: no-preference) {
            transition:
                color var(--duration-fast) linear var(--duration-base),
                background-size var(--duration-slow) var(--ease-out);
        }
    }

    /* Phones: two columns, the intro and the newest post full width. */
    .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-8) var(--space-4);

        @include m.from(tablet) {
            gap: var(--space-16) var(--space-8);
        }
    }

    ol {
        display: contents;
        list-style: none;
    }

    .intro,
    .featured {
        grid-column: 1 / -1;
    }

    li,
    a {
        display: flex;
        flex-direction: column;
    }

    a {
        flex: 1;
        text-decoration: none;
    }

    /* Highlighter marker: on hover or keyboard focus a bar of accent-warm
       wipes in behind the title and the text flips to the page color. The
       end padding and the negative end margin cancel out, so the bar
       overhangs the last glyph without moving anything. There is no start
       padding on purpose: with slice it would only apply to the first
       line, and a wrapped second line would look indented. */
    h2 span {
        background-image: linear-gradient(
            var(--color-accent-warm),
            var(--color-accent-warm)
        );
        background-repeat: no-repeat;
        background-position: 0 100%;
        background-size: 0% 100%;
        /* slice (the default, written out): when the title wraps, the bar is
           one strip cut across the lines, so the wipe runs through line 1 and
           then line 2. `clone` would fill every line at the same time. */
        box-decoration-break: slice;
        -webkit-box-decoration-break: slice;

        /* The wipe is only animated for people who allow motion. The text
           flips back at once when the bar leaves (the browser uses the
           transition of the state it moves to): bar-colored text over the
           page color would vanish while the bar shrinks. */
        @media (prefers-reduced-motion: no-preference) {
            transition:
                color var(--duration-fast) linear,
                background-size var(--duration-slow) var(--ease-out);
        }
    }

    @media (hover: hover) {
        a:hover h2 span {
            @include marker-on;
        }
    }

    a:focus-visible h2 span {
        @include marker-on;
    }

    /* The cover is the tile: a square, the image cropped to fill it. */

    @property --cover-overlay-opacity {
        syntax: "<number>";
        inherits: true;
        initial-value: 0;
    }

    .cover {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        z-index: -1;
        transition:
            --cover-overlay-opacity var(--duration-so-slow) var(--ease-out),
            scale var(--duration-so-slow) var(--ease-out);

        a:hover & {
            --cover-overlay-opacity: 0.5;
            --cover-overlay-opacity: 0.75;
            scale: 1.05;
        }

        &::after {
            content: "";
            position: absolute;
            inset: 0;
            background-color: rgb(
                from var(--color-accent-warm) r g b /
                    var(--cover-overlay-opacity)
            );
            mix-blend-mode: darken;
        }
    }

    .cover :global(img) {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    /* pixel art covers (frontmatter coverPixelated): hard pixel edges at
       any size and screen density, instead of smoothed into grey */
    .cover img.pixelated {
        image-rendering: pixelated;
    }

    h2 {
        margin-top: var(--space-3);
        font-size: var(--text-lg);
        font-weight: 400;
        line-height: var(--leading-tight);
    }

    .featured h2 {
        font-size: var(--text-3xl);
        letter-spacing: -0.02em;
    }

    p {
        margin-top: var(--space-2);
        max-width: 50ch;
        color: var(--color-text-muted);
    }

    /* Three columns: the newest post spans 2×2 on the right, the rest fill
       in around it in date order. Equal rows (1fr) make the big tile exactly
       two small tiles tall, captions included; its cover stretches to fill
       what its own caption leaves, so it stays close to square. */
    @include m.from(tablet) {
        .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            grid-auto-rows: 1fr;
        }

        .intro {
            grid-column: auto;
        }

        .featured {
            grid-column: 2 / span 2;
            grid-row: 1 / span 2;
        }

        .featured .cover {
            aspect-ratio: auto;
            flex: 1;
        }
    }
</style>
