<script lang="ts">
    import PostGrid from "$lib/components/PostGrid.svelte";

    let { data } = $props();
</script>

<svelte:head>
    <title>Drafts</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<section class="page">
    <h1>Drafts</h1>
    {#if data.posts.length > 0}
        <PostGrid posts={data.posts} />
    {:else}
        <p>No drafts.</p>
    {/if}
</section>

<style>
    .page {
        padding: var(--space-24) var(--space-8) var(--space-16);
        max-width: var(--max-w-wide);
        margin: 0 auto;
    }

    h1 {
        font-size: var(--text-4xl);
        font-weight: 400;
        letter-spacing: -0.02em;
        margin-bottom: var(--space-12);
    }
</style>
