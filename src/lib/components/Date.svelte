<script>
    let { date } = $props();

    const formatted = $derived(
        date
            ? new Date(date).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
              })
            : null,
    );
</script>

{#if formatted}
    <time datetime={date}>{formatted}</time>
{/if}

<style>
    time {
        display: block;
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        margin-top: var(--space-2);
    }
</style>
