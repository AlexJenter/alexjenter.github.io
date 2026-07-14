<script lang="ts">
    import { theme } from "$lib/theme.svelte";

    let label = $derived(
        `Switch to ${theme.resolved === "dark" ? "light" : "dark"} theme`,
    );
</script>

<button
    type="button"
    onclick={() => theme.toggle()}
    aria-label={label}
    title={label}
>
    {#if theme.resolved === "dark"}
        <!-- moon -->
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    {:else}
        <!-- sun -->
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="4" />
            <path
                d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
            />
        </svg>
    {/if}
</button>

<style>
    button {
        display: inline-flex;
        align-items: center;
        height: 100%;
        justify-content: center;
        padding: 0;
        border: none;
        background: none;
        color: var(--color-text-muted);
        cursor: pointer;
        transition: color var(--duration-fast) var(--ease-out);
    }

    button:hover {
        color: var(--color-text);
    }
</style>
