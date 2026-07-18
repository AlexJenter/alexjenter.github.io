<script lang="ts">
    interface Props {
        value: boolean;
        label?: string;
    }

    let { value = $bindable(), label }: Props = $props();
</script>

<!-- Boolean cell (viewfinder language): the Slider's head row minus the track —
     label left, a state box right that fills solid when on. -->
<label class="check">
    {#if label}
        <span class="label">{label}</span>
    {/if}
    <input type="checkbox" bind:checked={value} />
    <span class="box" aria-hidden="true"></span>
</label>

<style>
    .check {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        min-height: 22px;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        letter-spacing: 0.08em;
        cursor: pointer;
    }

    .label {
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        padding: var(--space-2);
        border: 1px solid var(--color-border);
    }

    input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
    }

    .box {
        flex-shrink: 0;
        width: 22px;
        height: auto;
        aspect-ratio: 1;
        border: 1px solid var(--color-border);
        background: transparent;
        transition:
            background var(--duration-fast) var(--ease-out),
            border-color var(--duration-fast) var(--ease-out);
    }

    .check:hover .box {
        border-color: var(--color-text-muted);
    }

    input:checked + .box {
        background: var(--color-text);
        border-color: var(--color-text);
    }

    input:focus-visible + .box {
        outline: 2px solid var(--color-text);
        outline-offset: 2px;
    }
</style>
