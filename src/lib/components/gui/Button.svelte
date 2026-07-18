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

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .btn {
        @include m.meta-label;
        @include m.transition(color, border-color, background);
        width: 100%;
        padding: var(--space-2);
        background: transparent;
        border: 1px solid var(--color-border);
        color: var(--color-text-muted);
        cursor: pointer;
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
        @include m.focus-ring;
    }
</style>
