<script lang="ts">
    import Date from "$lib/components/Date.svelte";
    let { data } = $props();
</script>

<section class="page">
    <h1>Lab</h1>

    {#if data.publicPosts.length === 0 && data.draftPosts.length === 0}
        <p class="empty">No posts yet.</p>
    {:else}
        {#snippet postList(posts: typeof data.publicPosts)}
            <ol class="post-list">
                {#each posts as post}
                    <li>
                        <a href="/lab/{post.slug}" class="post-link">
                            {#if post.cover}
                                {#if post.cover.svg}
                                    <img
                                        src={post.cover.src}
                                        alt={post.title}
                                        class="teaser"
                                    />
                                {:else}
                                    <enhanced:img
                                        src={post.cover.src}
                                        alt={post.title}
                                        class="teaser"
                                        sizes="(min-width: 1200px) 160px, 120px"
                                    />
                                {/if}
                            {/if}
                            <div class="meta">
                                <span class="title">{post.title}</span>
                                <Date date={post.date} />
                                {#if post.description}
                                    <p class="description">{post.description}</p>
                                {/if}
                            </div>
                        </a>
                    </li>
                {/each}
            </ol>
        {/snippet}

        {#if data.publicPosts.length > 0}
            {@render postList(data.publicPosts)}
        {/if}

        {#if data.draftPosts.length > 0}
            <h2 class="section-label">Drafts</h2>
            {@render postList(data.draftPosts)}
        {/if}
    {/if}
</section>

<style>
    .page {
        padding: var(--space-16) var(--space-8);
        max-width: var(--max-w-content);
        margin: 0 auto;
    }

    h1 {
        font-size: var(--text-4xl);
        font-weight: 400;
        letter-spacing: -0.02em;
        margin-bottom: var(--space-12);
    }

    .post-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
    }

    .post-link {
        display: flex;
        gap: var(--space-4);
        align-items: flex-start;
        text-decoration: none;
    }

    .post-link:hover .title {
        color: var(--color-accent-warm);
    }

    .teaser {
        width: 120px;
        /*height: 80px;*/
        object-fit: cover;
        border-radius: var(--radius-md);
        flex-shrink: 0;
    }

    .meta {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }

    .title {
        font-size: var(--text-xl);
        font-weight: 400;
        transition: color var(--duration-fast) var(--ease-out);
    }

    time.date {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        font-variation-settings: "opsz" var(--font-opsz-body);
    }

    .description {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }

    .empty {
        color: var(--color-text-muted);
    }

    .section-label {
        font-size: var(--text-xs);
        font-family: var(--font-mono, monospace);
        font-weight: 400;
        color: var(--color-text-muted);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-top: var(--space-12);
        margin-bottom: var(--space-4);
    }
</style>
