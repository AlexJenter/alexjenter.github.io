<script lang="ts">
    let { period, url, company } = $props<{
        period: string;
        url?: string;
        company: string;
    }>();
</script>

<div class="entry-header">
    <span class="period">{period}</span>
    {#if url}
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            class="company"
            aria-label="{company} (opens in new tab)"
            >{company} <span class="arrow">&LongRightArrow;</span></a
        >
    {:else}
        <span class="company">{company}</span>
    {/if}
</div>

<style>
    .entry-header {
        display: flex;
        align-items: baseline;
        gap: var(--space-3);
        margin-bottom: var(--space-1);
    }
    .period {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        white-space: nowrap;
        font-variation-settings: "opsz" var(--font-opsz-body);
    }

    .company {
        font-size: var(--text-base);
        font-weight: 500;
        text-decoration: none;
        text-transform: uppercase;
    }

    a.company:hover {
        color: var(--color-accent-warm);
    }

    .arrow {
        font-size: 2em;
        display: none;
        @media print {
            & {
                display: none;
            }
        }
    }
</style>
