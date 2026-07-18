<script lang="ts">
    import type { Component } from "svelte";

    // Colocated stories: any `X.story.svelte` next to a component in $lib
    // shows up here automatically. Glob must run in the component (not a
    // load function) — component constructors don't serialize.
    const modules = import.meta.glob<{ default: Component }>("/src/lib/**/*.story.svelte", {
        eager: true
    });

    const stories = Object.entries(modules)
        .map(([path, mod]) => ({
            name: path.replace("/src/lib/", "").replace(".story.svelte", ""),
            story: mod.default
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
</script>

<svelte:head>
    <title>UI Workbench — dev</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<div class="workbench">
    <header>
        <h1>UI Workbench</h1>
        <p class="hint">
            {stories.length}
            {stories.length === 1 ? "story" : "stories"} · components render under the real layout, tokens
            and theme — flip the theme in the nav to check both palettes
        </p>
    </header>

    {#each stories as { name, story: Story } (name)}
        <section aria-label={name}>
            <h2>{name}</h2>
            <div class="canvas">
                <Story />
            </div>
        </section>
    {:else}
        <p class="hint">No stories yet. Add a `Component.story.svelte` next to any component in src/lib.</p>
    {/each}
</div>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .workbench {
        max-width: var(--max-w-wide);
        margin: 0 auto;
        padding: var(--space-8) var(--space-4) var(--space-24);
    }

    header {
        margin-bottom: var(--space-12);
    }

    h1 {
        font-family: var(--font-serif);
        font-variation-settings: "opsz" var(--font-opsz-display);
        font-size: var(--text-3xl);
        margin: 0 0 var(--space-2);
    }

    .hint {
        @include m.meta-label;
        color: var(--color-text-muted);
        margin: 0;
    }

    section {
        margin-bottom: var(--space-16);
    }

    h2 {
        @include m.meta-label(var(--text-sm));
        font-weight: 400;
        color: var(--color-text-muted);
        border-bottom: 1px solid var(--color-border);
        padding-bottom: var(--space-2);
        margin: 0 0 var(--space-6);
    }

    .canvas {
        padding: var(--space-6);
        border: 1px dashed var(--color-border);
        border-radius: var(--radius-md);
    }
</style>
