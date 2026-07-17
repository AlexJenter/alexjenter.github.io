<script lang="ts">
    interface Props {
        value: string;
        options: { value: string; label: string }[];
        label?: string;
    }

    let { value = $bindable(), options, label }: Props = $props();
</script>

<!-- Instrument dropdown (viewfinder language): label above a full-width mono
     field with a muted chevron and sharp corners. -->
<label class="field">
    {#if label}
        <span class="label" title={label}>{label}</span>
    {/if}
    <select bind:value>
        {#each options as opt}
            <option value={opt.value}>{opt.label}</option>
        {/each}
    </select>
</label>

<style>
    .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
    }

    .label {
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    select {
        width: 100%;
        padding: var(--space-1) var(--space-2);
        background: transparent;
        border: 1px solid var(--color-border);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--color-text);
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235c5a56' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right var(--space-2) center;
        padding-right: calc(var(--space-2) + 14px);
        transition: border-color var(--duration-fast) var(--ease-out);
    }

    select:hover {
        border-color: var(--color-text-muted);
    }

    select:focus-visible {
        outline: 2px solid var(--color-text);
        outline-offset: 2px;
    }
</style>
