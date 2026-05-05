<script lang="ts">
    import favicon from "$lib/assets/favicon.svg";
    import "$lib/styles/global.css";
    import Nav from "$lib/components/Nav.svelte";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<a href="#main" class="skip-link">Skip to main content</a>
<Nav />

<main id="main">
    {@render children()}
</main>

<style>
    .skip-link {
        position: absolute;
        left: -9999px;
        top: var(--space-2);
        padding: var(--space-2) var(--space-4);
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: var(--text-sm);
        z-index: 100;
    }

    .skip-link:focus {
        left: var(--space-4);
    }

    main {
        min-height: 100dvh;
    }
</style>
