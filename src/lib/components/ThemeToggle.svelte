<script lang="ts">
    import { theme, type Preference } from "$lib/theme.svelte";

    // Cycle order for the single-button control.
    const order: Preference[] = ["system", "light", "dark"];
    const nextLabel: Record<Preference, string> = {
        system: "light",
        light: "dark",
        dark: "system",
    };

    function cycle() {
        const i = order.indexOf(theme.preference);
        theme.set(order[(i + 1) % order.length]);
    }

    let label = $derived(`Switch to ${nextLabel[theme.preference]} theme`);
</script>

<button type="button" onclick={cycle} aria-label={label} title={label}>
    {#if theme.preference === "system"}
        <!-- monitor -->
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
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
        </svg>
    {:else if theme.preference === "dark"}
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
