<script lang="ts">
    interface Props {
        label: string;
        onclick: () => void;
    }

    let { label, onclick }: Props = $props();
</script>

<!--
    The command button. Its frame follows the shared hover/focus
    ladder (m.marks): muted at rest, text colour on hover, warm on focus.
    Press inverts.
-->
<button type="button" {onclick} class="btn">{label}</button>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .btn {
        @include m.marks;
        @include m.frame;
        @include m.meta-label;
        @include m.transition(color, border-color, background);
        width: 100%;
        min-height: 28px;
        padding: var(--space-2);
        background: transparent;
        color: var(--color-text-muted);
        cursor: pointer;

        @media (pointer: coarse) {
            min-height: 44px;
        }

        @media (hover: hover) {
            &:hover {
                color: var(--color-text);
            }
        }

        &:active {
            background: var(--color-text);
            border-color: var(--color-text);
            color: var(--color-bg);
        }
    }
</style>
