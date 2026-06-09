<script lang="ts">
    interface Props {
        label: string;
        onclick: () => void;
    }

    let { label, onclick }: Props = $props();
</script>

<button type="button" {onclick} class="btn">{label}</button>

<style>
    .btn {
        width: 100%;
        padding: var(--space-1) var(--space-2);
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-family: inherit;
        font-size: var(--text-xs);
        font-variation-settings: inherit;
        color: var(--color-text);
        cursor: pointer;
        transition:
            background var(--duration-fast) var(--ease-out),
            border-color var(--duration-fast) var(--ease-out);
    }

    .btn:hover {
        background: var(--color-border);
        border-color: var(--color-text-muted);
    }

    .btn:active {
        background: var(--color-text-muted);
        color: var(--color-bg);
    }
</style>
