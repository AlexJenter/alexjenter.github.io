<script lang="ts">
    import { page } from "$app/stores";
    import { afterNavigate } from "$app/navigation";
    import ThemeToggle from "./ThemeToggle.svelte";

    const links = [
        { href: "/lab", label: "Lab" },
        { href: "/resume", label: "Resume" },
    ];

    let open = $state(false);
    let nav: HTMLElement | undefined = $state();
    let toggle: HTMLButtonElement | undefined = $state();

    afterNavigate(() => (open = false));

    function onKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && open) {
            open = false;
            toggle?.focus();
        }
    }

    function onPointerDown(e: PointerEvent) {
        if (open && nav && !nav.contains(e.target as Node)) open = false;
    }
</script>

<svelte:window onkeydown={onKeydown} />
<svelte:document onpointerdown={onPointerDown} />

<nav aria-label="Site navigation" bind:this={nav}>
    <a href="/" class="wordmark" aria-label="Home">A</a>
    <div class="cluster">
        <ul id="site-menu" class:open>
            {#each links as { href, label }}
                <li>
                    <a
                        {href}
                        class:active={$page.url.pathname === href}
                        aria-current={$page.url.pathname === href
                            ? "page"
                            : undefined}
                        onclick={() => (open = false)}>{label}</a
                    >
                </li>
            {/each}
        </ul>
        <ThemeToggle />
        <button
            bind:this={toggle}
            class="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onclick={() => (open = !open)}
        >
            {#if open}
                <!-- x -->
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            {:else}
                <!-- menu -->
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
            {/if}
        </button>
    </div>
</nav>

<style>
    nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4) var(--space-8);
        /*border-bottom: 1px solid var(--color-border);*/
        position: fixed;
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

    .cluster {
        position: relative;
        display: flex;
        align-items: stretch;
        background-color: var(--color-surface);
        border-radius: 4px;
    }

    /* Collapsed (default): the link list is a dropdown card under the pill */
    ul {
        position: absolute;
        top: calc(100% + var(--space-2));
        right: 0;
        min-width: 9rem;
        display: flex;
        flex-direction: column;
        list-style: none;
        background-color: var(--color-surface);
        border-radius: 4px;
        overflow: hidden;
        opacity: 0;
        translate: 0 calc(-1 * var(--space-2));
        visibility: hidden;
        transition:
            opacity var(--duration-base) var(--ease-out),
            translate var(--duration-base) var(--ease-out),
            visibility 0s linear var(--duration-base);
    }

    /* visibility is left out here so it flips immediately on open,
       but waits for the fade-out (delay above) on close */
    ul.open {
        opacity: 1;
        translate: 0 0;
        visibility: visible;
        transition:
            opacity var(--duration-base) var(--ease-out),
            translate var(--duration-base) var(--ease-out);
    }

    li {
        display: flex;
        & + & {
            border-top: 1px solid rgb(255 255 255 / 0.25);
        }
    }

    li > a {
        flex: 1;
        justify-content: flex-start;
        padding: var(--space-3) var(--space-4);
        font-size: var(--text-sm);
    }

    .cluster > :global(button) {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-sm);
    }

    .menu-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: none;
        color: var(--color-text-muted);
        cursor: pointer;
        border-left: 1px solid rgb(255 255 255 / 0.25);
        transition: color var(--duration-fast) var(--ease-out);
    }

    .menu-toggle:hover {
        color: var(--color-text);
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

    @media (min-width: 48rem) {
        /* Expanded: links, theme toggle and pill collapse into one row */
        ul {
            position: static;
            min-width: 0;
            flex-direction: row;
            background: none;
            overflow: visible;
            opacity: 1;
            translate: none;
            visibility: visible;
            transition: none;
        }

        li + li {
            border-top: none;
            border-left: 1px solid rgb(255 255 255 / 0.25);
        }

        li > a {
            justify-content: center;
            padding: 0.25em 1em;
        }

        /* hairline between the last link and the theme toggle */
        .cluster > :global(button) {
            padding: 0.25em 1em;
            border-left: 1px solid rgb(255 255 255 / 0.25);
        }

        .menu-toggle {
            display: none;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        ul,
        ul.open {
            transition: none;
        }
    }

    @media print {
        nav {
            display: none;
        }
    }
</style>
