<script lang="ts">
    import ThreadDiagram from "$lib/components/ThreadDiagram.svelte";
</script>

<ThreadDiagram
    title="How a stipple point finds its cell"
    description="Four nodes in a diamond: image, density, voronoi, points. Image feeds density, density feeds voronoi, voronoi feeds points."
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
