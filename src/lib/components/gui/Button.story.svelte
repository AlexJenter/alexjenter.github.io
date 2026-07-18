<script lang="ts">
    import Button from "./Button.svelte";

    let clicks = $state(0);
</script>

<div class="variants">
    <section>
        <h3>default · pane width</h3>
        <div class="frame">
            <Button label="Export PNG" onclick={() => clicks++} />
        </div>
        <p class="note">clicks: {clicks}</p>
    </section>

    <section>
        <h3>long label</h3>
        <div class="frame">
            <Button label="Regenerate stipple distribution" onclick={() => clicks++} />
        </div>
    </section>

    <section>
        <h3>stacked · pane context</h3>
        <div class="frame stack">
            <Button label="Randomize seed" onclick={() => clicks++} />
            <Button label="Reset camera" onclick={() => clicks++} />
            <Button label="Export PNG" onclick={() => clicks++} />
        </div>
    </section>
</div>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .variants {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-8);
        align-items: flex-start;
    }

    h3 {
        @include m.meta-label;
        font-weight: 400;
        color: var(--color-text-muted);
        margin: 0 0 var(--space-2);
    }

    /* Buttons are width:100% pane controls, so each variant gets a
       pane-ish column to fill. */
    .frame {
        width: 13rem;
    }

    .stack {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .note {
        @include m.meta-label;
        color: var(--color-text-muted);
        margin: var(--space-2) 0 0;
    }
</style>
