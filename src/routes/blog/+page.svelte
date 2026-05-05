<script lang="ts">
    let { data } = $props();
</script>

<section class="page">
    <h1>Blog</h1>

    {#if data.posts.length === 0}
        <p class="empty">No posts yet.</p>
    {:else}
        <ol class="post-list">
            {#each data.posts as post}
                <li>
                    <a href="/blog/{post.slug}" class="post-link">
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
                            <time class="date" datetime={post.date}>{post.date}</time>
                            {#if post.description}
                                <p class="description">{post.description}</p>
                            {/if}
                        </div>
                    </a>
                </li>
            {/each}
        </ol>
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
</style>
