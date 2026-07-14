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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun-icon lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
    {:else}
        <!-- sun -->
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon-icon lucide-moon"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>
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
