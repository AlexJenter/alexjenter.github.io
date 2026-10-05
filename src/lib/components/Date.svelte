<script>
    import { formatDate } from "$lib/date";

    let { date } = $props();

    const formatted = $derived(date ? formatDate(date) : null);
</script>

{#if formatted}
    <time datetime={date}>{formatted}</time>
{/if}

<style>
    time {
        display: block;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        font-variant-numeric: tabular-nums;
        color: var(--color-text-muted);
        margin-top: var(--space-2);
    }
</style>
