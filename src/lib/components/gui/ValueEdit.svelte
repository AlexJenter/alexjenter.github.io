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

    // The widest the value can print, so the box keeps one width as the digits
    // change (a fractional step prints two decimals: "42.00").
    const chars = $derived(
        Math.max(
            text.length,
            String(Math.round(max)).length + (Number.isInteger(step) ? 0 : 3),
        ),
    );

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

<!--
    The button stays in the layout while editing (hidden) and the input is laid
    over exactly its box, so switching between the two cannot move anything.
    One underline on the wrapper serves both states.
-->
<span class="field" style:min-width="{chars}ch">
    <button
        bind:this={buttonEl}
        type="button"
        class="value"
        class:hidden={editing}
        title="Click to edit"
        aria-label={`Edit ${name}`}
        onclick={start}
    >
        {text}
    </button>
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
    {/if}
</span>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    /* a 24px-tall target, with the layout box unchanged (the padding is
       cancelled by the negative margin) */
    .field {
        --underline: transparent;
        position: relative;
        flex-shrink: 0;
        display: inline-block;
        margin: -4px -2px;
        text-align: right;
    }

    /* one underline for both states, just under the digits */
    .field::after {
        content: "";
        position: absolute;
        left: 2px;
        right: 2px;
        bottom: 3px;
        height: 1px;
        background: var(--underline);
        pointer-events: none;
        @include m.transition(background);
    }

    @media (hover: hover) {
        .field:hover {
            --underline: var(--color-text-dim);
        }
    }

    /* focus, as for every control: warm, with no outline ring */
    .field:focus-within {
        --underline: var(--color-accent-warm);
    }

    .value,
    .edit {
        display: block;
        box-sizing: border-box;
        width: 100%;
        padding: 4px 2px;
        font: inherit;
        line-height: inherit;
        text-align: right;
        color: var(--color-text);
        background: none;
        border: none;
        outline: none;
        @include m.transition(color);
    }

    .value {
        cursor: text;
    }

    .hidden {
        visibility: hidden;
    }

    .field:focus-within .value,
    .edit {
        color: var(--color-accent-warm);
    }

    .edit {
        position: absolute;
        inset: 0;
        appearance: textfield;
        -moz-appearance: textfield;
    }

    .edit::-webkit-inner-spin-button,
    .edit::-webkit-outer-spin-button {
        appearance: none;
    }

    /* the browser's default selection blue clashes with the warm accent */
    .edit::selection {
        background: color-mix(in srgb, var(--color-accent-warm) 35%, transparent);
        color: var(--color-text);
    }
</style>
