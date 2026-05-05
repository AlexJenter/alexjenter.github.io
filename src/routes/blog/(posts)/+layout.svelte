<script lang="ts">
    let { children, data } = $props();
</script>

<article class="post">
    <header>
        <h1>{data.title}</h1>
        {#if data.date}
            <time
                >{new Date(data.date).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}</time
            >
        {/if}
    </header>
    {@render children()}
</article>

<style>
    header {
        margin-bottom: var(--space-12);
    }

    time {
        display: block;
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        margin-top: var(--space-2);
    }

    .post {
        padding: var(--space-16) var(--space-8);
        max-width: var(--max-w-content);
        margin: 0 auto;
    }

    .post :global(h1) {
        font-size: var(--text-4xl);
        font-weight: 400;
        letter-spacing: -0.02em;
        margin-bottom: var(--space-3);
    }

    .post :global(h2) {
        font-size: var(--text-2xl);
        font-weight: 400;
        letter-spacing: -0.01em;
        margin-top: var(--space-12);
        margin-bottom: var(--space-4);
    }

    .post :global(h3) {
        font-size: var(--text-xl);
        font-weight: 400;
        margin-top: var(--space-8);
        margin-bottom: var(--space-3);
    }

    .post :global(p) {
        margin-bottom: var(--space-4);
    }

    .post :global(ul),
    .post :global(ol) {
        padding-left: var(--space-6);
        margin-bottom: var(--space-4);
    }

    .post :global(li) {
        margin-bottom: var(--space-2);
    }

    .post :global(hr) {
        border: none;
        border-top: 1px solid var(--color-border);
        margin: var(--space-12) 0;
    }

    .post :global(img) {
        max-width: 100%;
        border-radius: var(--radius-md);
    }

    .post :global(blockquote) {
        font-size: var(--text-xl);
        padding-inline-start: 15px;
        border-inline-start: 5px solid whitesmoke;
    }
</style>
