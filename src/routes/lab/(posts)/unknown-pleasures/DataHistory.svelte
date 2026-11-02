<script lang="ts">
    import ThreadList from "$lib/components/ThreadList.svelte";

    const christiansen2015 = {
        label: "Christiansen 2015",
        href: "https://www.scientificamerican.com/blog/sa-visual/pop-culture-pulsar-origin-story-of-joy-division-s-unknown-pleasures-album-cover-video/",
    };
    const christiansenCraft2020 = {
        label: "Christiansen & Craft 2020",
        href: "https://www.scientificamerican.com/article/the-pulsar-chart-that-became-a-pop-icon-turns-50-joy-division-rsquo-s-unknown-pleasures",
    };
    const adamCap = {
        label: "Adam Cap",
        href: "http://adamcap.com/2011/05/19/history-of-joy-division-unknown-pleasures-album-art/",
    };
</script>

<ThreadList
    title="From the first pulsar to the Unknown Pleasures cover and this page"
    items={[
        {
            tag: "1967",
            label: "Jocelyn Bell (Burnell) finds the first pulsar at Cambridge",
        },
        {
            tag: "1970",
            label: "Harold D. Craft Jr. makes the plot from Arecibo data for his Cornell thesis",
            sources: [christiansen2015, christiansenCraft2020],
        },
        {
            tag: "1971",
            label: 'Scientific American prints it with "The Nature of Pulsars" (Jeremiah Ostriker), credited to Arecibo',
            sources: [christiansen2015, adamCap],
        },
        {
            tag: "1974",
            label: "Graphis Diagrams (ed. Walter Herdeg)",
        },
        {
            tag: "1977",
            label: "The Cambridge Encyclopaedia of Astronomy (ed. Simon Mitton)",
        },
        {
            tag: "1979",
            label: "Unknown Pleasures (Joy Division)",
            sources: [adamCap],
        },
        {
            tag: "2015",
            label: "Jen Christiansen of Scientific American finds and interviews Craft",
            sources: [christiansen2015],
        },
        {
            tag: "2024",
            label: "Mauricio “Pachá” Vargas Sepúlveda publishes a CSV of the data, found on an old external drive. Who made it, and when, is unknown",
            sources: [
                {
                    label: "Vargas Sepúlveda 2024",
                    href: "https://www.r-bloggers.com/2024/06/cp-1919-psr-b191921-dataset-2/",
                },
                {
                    label: "cp1919 repo",
                    href: "https://github.com/pachadotdev/cp1919",
                },
            ],
        },
        {
            tag: "now",
            label: "A Python script turns the CSV into the JSON this page draws",
        },
    ]}
/>
