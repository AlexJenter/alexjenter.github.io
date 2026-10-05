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
            <li class:featured={i === 0}>
                <a href="/lab/{post.slug}">
                    <div class="cover">
                        {#if post.cover?.svg}
                            <img src={post.cover.src} alt="" />
                        {:else if post.cover}
                            <enhanced:img
                                src={post.cover.src}
                                alt=""
                                sizes={i === 0
                                    ? "(min-width: 75rem) 760px, (min-width: 48rem) 66vw, 100vw"
                                    : "(min-width: 75rem) 370px, (min-width: 48rem) 33vw, 50vw"}
                            />
                        {/if}
                    </div>
                    <h2>{post.title}</h2>
                    {#if i === 0 && post.description}
                        <p>{post.description}</p>
                    {/if}
                    <Date date={post.date} />
                </a>
            </li>
        {/each}
    </ol>
</div>

<style>
    /* Phones: two columns, the intro and the newest post full width. */
    .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-8) var(--space-4);
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
        transition: color var(--duration-fast) var(--ease-out);
    }

    /* The cover is the tile: a square, the image cropped to fill it. */
    .cover {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        border-radius: var(--radius-md);
        background: var(--color-surface);
    }

    .cover :global(img) {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
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
    @media (min-width: 48rem) {
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
