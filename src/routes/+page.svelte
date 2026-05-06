<script lang="ts">
    import { links } from "$lib/data/work";
</script>

<section class="hero">
    <h1>Frontend dev &<br />creative coder.</h1>
    <p>Building interfaces and experiments on the web.</p>
</section>

<section class="work">
    <h2>Work</h2>
    <p>Selected projects.</p>
    <ul>
        {#each links as { url, label }}
            <li><a href={url} target="_blank" rel="noopener">{label}</a></li>
        {/each}
    </ul>
</section>

<style>
    .hero {
        padding: var(--space-24) var(--space-8);
        max-width: var(--max-w-wide);
        margin: 0 auto;
    }

    .work {
        padding: var(--space-16) var(--space-8);
        max-width: var(--max-w-wide);
        margin: 0 auto;
    }

    h1 {
        font-size: var(--text-5xl);
        font-weight: 400;
        letter-spacing: -0.03em;
        margin-bottom: var(--space-4);
    }

    p {
        font-size: var(--text-lg);
        color: var(--color-text-muted);
    }

    .work {
        ul {
            list-style: none;
        }
        /*ul:hover li {
            letter-spacing: 2px;
            opacity: 0.5;
            transition:
                letter-spacing 300ms ease-out,
                opacity 300ms ease-out;
            &:hover {
                opacity: 1;
                letter-spacing: initial;
            }
        }*/
    }
</style>
