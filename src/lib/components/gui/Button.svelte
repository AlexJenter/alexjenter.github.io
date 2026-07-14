<script lang="ts">
    interface Props {
        label: string;
        onclick: () => void;
    }

    let { label, onclick }: Props = $props();
</script>

<!-- Hairline command (viewfinder language): uppercase mono label, muted at
     rest, brightens on hover, inverts solid on press. -->
<button type="button" {onclick} class="btn">{label}</button>

<style>
    .btn {
        width: 100%;
        padding: var(--space-2);
        background: transparent;
        border: 1px solid var(--color-border);
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-text-muted);
        cursor: pointer;
        transition:
            color var(--duration-fast) var(--ease-out),
            border-color var(--duration-fast) var(--ease-out),
            background var(--duration-fast) var(--ease-out);
    }

    .btn:hover {
        color: var(--color-text);
        border-color: var(--color-text-muted);
    }

    .btn:active {
        background: var(--color-text);
        border-color: var(--color-text);
        color: var(--color-bg);
    }

    .btn:focus-visible {
        outline: 2px solid var(--color-text);
        outline-offset: 2px;
    }
</style>
