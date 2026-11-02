<script lang="ts" module>
    export const title = "ThreadDiagram";
    export const order = 20;
</script>

<script lang="ts">
    import ThreadDiagram from "./ThreadDiagram.svelte";
</script>

<!--
    Relationship diagram: pins on a grid, taut threads between them. Positions
    are explicit grid units. Unknown or duplicate ids throw. Threads draw in
    link order, each one over the earlier ones, with a gap cut where they cross.
-->
<div class="variants">
    <section>
        <h3>taut · labelled pins</h3>
        <ThreadDiagram
            title="How a stipple point finds its cell"
            description="Four nodes in a diamond: image, density, voronoi, points. Image feeds density, density feeds voronoi, voronoi feeds points."
            nodes={[
                { id: "img", x: 0, y: 1, label: "Image", side: "w" },
                { id: "den", x: 2, y: 0, label: "Density", side: "n" },
                { id: "vor", x: 4, y: 1, label: "Voronoi", side: "e" },
                { id: "pts", x: 2, y: 2, label: "Points", side: "s" },
            ]}
            links={[
                { from: "img", to: "den" },
                { from: "den", to: "vor" },
                { from: "vor", to: "pts" },
                { from: "pts", to: "img" },
            ]}
        />
    </section>

    <section>
        <h3>crossings · the gap</h3>
        <ThreadDiagram
            title="Everything connects to everything"
            nodes={[
                { id: "a", x: 0, y: 0, label: "Noise", side: "w" },
                { id: "b", x: 4, y: 0, label: "Threshold", side: "e" },
                { id: "c", x: 0, y: 3, label: "Mask", side: "w" },
                { id: "d", x: 4, y: 3, label: "Output", side: "e" },
                { id: "e", x: 2, y: -1, label: "Seed", side: "n" },
            ]}
            links={[
                { from: "a", to: "d" },
                { from: "b", to: "c" },
                { from: "a", to: "b" },
                { from: "c", to: "d" },
                { from: "e", to: "a" },
                { from: "e", to: "b" },
            ]}
        />
    </section>

    <section>
        <h3>link labels · sag 0.04</h3>
        <ThreadDiagram
            title="Who talks to whom"
            sag={0.1}
            nodes={[
                { id: "ui", x: 0, y: 0, label: "Drawer", side: "n" },
                { id: "st", x: 3, y: 1, label: "State", side: "s" },
                { id: "gl", x: 6, y: 0, label: "Shader", side: "n" },
            ]}
            links={[
                { from: "ui", to: "st", label: "writes" },
                { from: "st", to: "gl", label: "uniforms" },
                { from: "ui", to: "gl", label: "export" },
            ]}
        />
    </section>

    <section class="wide">
        <h3>Use Case - Sequence of Events</h3>
        <ThreadDiagram
            title="Sequence of Events"
            description="Five nodes vertically spaced"
            nodes={[
                {
                    id: "joc",
                    x: 0,
                    y: 0,
                    label: "1967-68: Jocelyn Bell (Burnell) finds the first pulsar at Cambridge",
                    side: "e",
                },
                {
                    id: "cra",
                    x: 0,
                    y: 1,
                    label: "1970: Harold D. Craft Jr. makes the plot from Arecibo data for his Cornell thesis",
                    side: "e",
                },
                {
                    id: "dia",
                    x: 0,
                    y: 2,
                    label: "1974: Graphis Diagrams (ed. Walter Herdeg)",
                    side: "e",
                },
                {
                    id: "cam",
                    x: 0,
                    y: 3,
                    label: "1977: The Cambridge Encyclopaedia of Astronomy (ed. Simon Mitton)",
                    side: "e",
                },
                {
                    id: "joy",
                    x: 0,
                    y: 4,
                    label: "1979: Unknown Pleasures (Joy Division)",
                    side: "e",
                },
            ]}
            links={[
                { from: "joc", to: "cra" },
                { from: "cra", to: "dia" },
                { from: "dia", to: "cam" },
                { from: "cam", to: "joy" },
            ]}
        />
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

    .wide {
        grid-column: 1 / -1;
    }

    h3 {
        @include m.meta-label;
        font-weight: 400;
        color: var(--color-text-muted);
        margin: 0 0 var(--space-4);
    }
</style>
