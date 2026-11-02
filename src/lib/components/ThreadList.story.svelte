<script lang="ts" module>
    export const title = "ThreadList";
    export const order = 21;
</script>

<script lang="ts">
    import ThreadList from "./ThreadList.svelte";

    const items = [
        {
            tag: "1970",
            label: "Harold D. Craft Jr. makes the plot from Arecibo data for his Cornell thesis",
            sources: [
                { label: "Christiansen 2015", href: "https://example.com/1" },
                { label: "Christiansen & Craft 2020", href: "https://example.com/2" },
            ],
        },
        { tag: "1974", label: "Graphis Diagrams (ed. Walter Herdeg)" },
        {
            tag: "1979",
            label: "Unknown Pleasures (Joy Division)",
            sources: [{ label: "Adam Cap", href: "https://example.com/3" }],
        },
    ];
</script>

<!--
    The vertical ThreadDiagram as plain HTML. The browser wraps the text, so
    nothing re-lays out after hydration. Resize the window or squeeze the
    narrow column to watch labels and chips wrap.
-->
<div class="variants">
    <section>
        <h3>numbered · default tags</h3>
        <ThreadList
            title="Three steps"
            items={[
                { label: "Image" },
                { label: "Density" },
                { label: "Voronoi" },
                { label: "Points" },
            ]}
        />
    </section>

    <section>
        <h3>year tags · source chips</h3>
        <ThreadList title="Three dated steps" {items} />
    </section>

    <section class="narrow">
        <h3>narrow · 16rem</h3>
        <ThreadList title="Three dated steps, narrow" {items} />
    </section>
</div>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .variants {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
        gap: var(--space-12) var(--space-8);
        align-items: start;
    }

    .narrow {
        max-width: 16rem;
    }

    h3 {
        @include m.meta-label;
        font-weight: 400;
        color: var(--color-text-muted);
        margin: 0 0 var(--space-4);
    }
</style>
