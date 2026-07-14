<script lang="ts">
    import { page } from "$app/stores";
    import ThemeToggle from "./ThemeToggle.svelte";

    const links = [
        { href: "/lab", label: "Lab" },
        { href: "/resume", label: "Resume" },
    ];
</script>

<nav aria-label="Site navigation">
    <a href="/" class="wordmark" aria-label="Home">A</a>
    <ul>
        {#each links as { href, label }}
            <li>
                <a
                    {href}
                    class:active={$page.url.pathname === href}
                    aria-current={$page.url.pathname === href
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
        padding: var(--space-4) var(--space-8);
        /*border-bottom: 1px solid var(--color-border);*/
        position: absolute;
        width: 100%;
        top: 0;
        /*background: rgb(from var(--color-bg) r b g / 0.1);*/

        z-index: 10;
    }

    .wordmark {
        padding: 0.125em .75em;
        font-size: var(--text-lg);
        font-weight: 500;
        text-decoration: none;
        letter-spacing: -0.02em;
        background-color: var(--color-surface);
        border-radius: 4px;
    }

    ul {
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
