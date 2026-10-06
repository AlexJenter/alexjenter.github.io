<script lang="ts">
    import { page } from "$app/state";
    import ThemeToggle from "./ThemeToggle.svelte";

    const links = [{ href: "/resume", label: "Resume" }];

    // On a post, the A carries a crumb with its title: the hero's first
    // screen names the piece without laying anything over the artwork.
    const post = $derived(page.route.id?.startsWith("/lab/(posts)"));
    const title = $derived(post ? page.data.title : undefined);
    const short = $derived(
        post ? (page.data.short ?? page.data.title) : undefined,
    );
</script>

<nav aria-label="Site navigation">
    <div class="crumbs">
        <a href="/" class="wordmark" aria-label="Home">A</a>
        {#if title}
            <!-- phones get the frontmatter `short` title (display: none
                 keeps the other one out of the accessibility tree too) -->
            <span class="sep" aria-hidden="true">/</span>
            <span class="crumb full" aria-current="page">{title}</span>
            <span class="crumb short" aria-current="page">{short}</span>
        {/if}
    </div>
    <ul>
        {#each links as { href, label }}
            <li>
                <a
                    {href}
                    class:active={page.url.pathname === href}
                    aria-current={page.url.pathname === href
                        ? "page"
                        : undefined}>{label}</a
                >
            </li>
        {/each}
        <li><ThemeToggle /></li>
    </ul>
</nav>

<style>
    nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4);
        /*border-bottom: 1px solid var(--color-border);*/
        position: fixed;
        width: 100%;
        top: 0;
        /*background: rgb(from var(--color-bg) r b g / 0.1);*/

        z-index: 10;
    }

    /* One pill: the A, then (on posts) "/ title", cut with an ellipsis
       when it would run into the links on the right. */
    .crumbs {
        display: flex;
        align-items: center;
        min-width: 0;
        margin-right: var(--space-4);
        background-color: var(--color-surface);
        border-radius: 4px;
    }

    .wordmark {
        flex-shrink: 0;
        padding: 0.125em 0.75em;
        font-size: var(--text-lg);
        font-weight: 500;
        letter-spacing: -0.02em;
    }

    .sep {
        color: var(--color-text-muted);
        font-size: var(--text-sm);
    }

    .crumb {
        min-width: 0;
        padding: 0.25em 1em 0.25em 0.75em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--text-sm);
        font-weight: 500;
    }

    /* Phones get a narrower gutter and the short title, which leaves the
       crumb room for every current post title. */
    .crumb.full {
        display: none;
    }

    @media (min-width: 32rem) {
        nav {
            padding-inline: var(--space-8);
        }

        .crumb.full {
            display: block;
        }

        .crumb.short {
            display: none;
        }
    }

    /* never shrinks: with overflow hidden it could, and the crumb is the
       one that should give way */
    ul {
        flex-shrink: 0;
        display: flex;
        list-style: none;
        background-color: var(--color-surface);
        overflow: hidden;
        border-radius: 4px;
    }

    li {
        display: flex;
        & + & {
            border-left: 1px solid rgb(255 255 255 /0.25);
        }
    }

    li > a,
    li > :global(button) {
        padding: 0.25em 1em;
        font-size: var(--text-sm);
    }

    a {
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        color: var(--color-text-muted);
        transition: color var(--duration-fast) var(--ease-out);
    }

    a:hover,
    a.active {
        color: var(--color-text);
    }

    a.active {
        font-weight: 500;
    }

    @media print {
        nav {
            display: none;
        }
    }
</style>
