<script lang="ts">
    const links = [
        "upset.ch",
        "zurichaestheticslab.ch",
        "kiff.ch",
        "versive.cc",
    ];
</script>

<section class="page">
    <h1>Work</h1>
    <p>Selected projects.</p>
    <ul>
        {#each links as link}
            <li><a href={link}>{link}</a></li>
        {/each}
    </ul>
</section>

<style>
    .page {
        padding: var(--space-16) var(--space-8);
        max-width: var(--max-w-wide);
        margin: 0 auto;
    }

    h1 {
        font-size: var(--text-4xl);
        font-weight: 400;
        letter-spacing: -0.02em;
        margin-bottom: var(--space-4);
    }

    p {
        color: var(--color-text-muted);
    }

    ul {
        list-style: none;
    }
</style>
