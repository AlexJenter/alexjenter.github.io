<script lang="ts">
    import { tick } from "svelte";
    import { clamp, snap } from "./slider-math";

    interface Props {
        /** The number being edited. */
        value: number;
        /** How it prints at rest. */
        text: string;
        min: number;
        max: number;
        step: number;
        /** Accessible name of the value, e.g. "Amount" or "Window minimum". */
        name: string;
        /** Called with the typed number, already clamped and snapped. */
        oncommit: (value: number) => void;
    }

    let { value, text, min, max, step, name, oncommit }: Props = $props();

    let editing = $state(false);
    let draft = $state<number | null>(null);
    let buttonEl = $state<HTMLButtonElement | undefined>(undefined);

    function start() {
        draft = value;
        editing = true;
    }

    function commit() {
        if (!editing) return;
        editing = false;
        if (draft !== null && !Number.isNaN(draft)) {
            oncommit(snap(clamp(draft, min, max), step));
        }
    }

    // Enter and Escape end the edit from the keyboard, so focus goes back to
    // the button instead of being lost with the removed input. A blur (click
    // elsewhere) commits and leaves focus where the user put it.
    async function onkeydown(e: KeyboardEvent) {
        if (e.key !== "Enter" && e.key !== "Escape") return;
        e.preventDefault();
        if (e.key === "Enter") commit();
        editing = false;
        await tick();
        buttonEl?.focus();
    }

    function focusAndSelect(el: HTMLInputElement) {
        el.focus();
        el.select();
    }
</script>

{#if editing}
    <input
        {@attach focusAndSelect}
        type="number"
        bind:value={draft}
        {min}
        {max}
        {step}
        class="edit"
        aria-label={name}
        onblur={commit}
        {onkeydown}
    />
{:else}
    <button
        bind:this={buttonEl}
        type="button"
        class="value"
        title="Click to edit"
        aria-label={`Edit ${name}`}
        onclick={start}
    >
        {text}
    </button>
{/if}

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .value,
    .edit {
        flex-shrink: 0;
        font: inherit;
        color: var(--color-text);
        background: none;
        border: none;
        /* a 24px-tall target, with the layout box unchanged */
        padding: 4px 2px;
        margin: -4px -2px;
    }

    .value {
        cursor: text;
        border-bottom: 1px solid transparent;
        @include m.transition(border-color);
    }

    .value:hover {
        border-bottom-color: var(--color-text-muted);
    }

    .value:focus-visible {
        @include m.focus-ring;
    }

    .edit {
        width: calc(6ch + 4px);
        border-bottom: 1px solid var(--color-text-muted);
        outline: none;
        text-align: right;
        appearance: textfield;
        -moz-appearance: textfield;
    }

    .edit::-webkit-inner-spin-button,
    .edit::-webkit-outer-spin-button {
        appearance: none;
    }
</style>
