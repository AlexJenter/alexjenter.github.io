<script lang="ts">
    import { work, education, languages, skills } from "$lib/data/resume";
</script>

<svelte:head>
    <title>Resume — Alex Jenter</title>
</svelte:head>

<div class="resume">
    <header>
        <div>
            <h1>Alex Jenter</h1>
            <p class="tagline">Web developer with a background in design</p>
        </div>
        <!-- <enhanced:img
            class="photo"
            width="256px"
            height="256px"
            src="./foto-av.jpg"
            alt="photo of alex jenter"
        /> -->
    </header>

    <section>
        <h2>Work</h2>
        <ol class="entries">
            {#each work as entry}
                <li class="entry">
                    <div class="entry-header">
                        <span class="period">{entry.period}</span>
                        {#if entry.url}
                            <a
                                href={entry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="company">{entry.company}</a
                            >
                        {:else}
                            <span class="company">{entry.company}</span>
                        {/if}
                    </div>
                    <p class="title">{entry.title}</p>
                    <p class="description">{entry.description}</p>
                    <ul class="highlights">
                        {#each entry.highlights as h}
                            <li>{h}</li>
                        {/each}
                    </ul>
                </li>
            {/each}
        </ol>
    </section>

    <section>
        <h2>Education</h2>
        <ol class="entries">
            {#each education as entry}
                <li class="entry">
                    <div class="entry-header">
                        <span class="period">{entry.period}</span>
                        {#if entry.url}
                            <a
                                href={entry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="company">{entry.institution}</a
                            >
                        {:else}
                            <span class="company">{entry.institution}</span>
                        {/if}
                    </div>
                    <p class="description">{entry.credential}</p>
                </li>
            {/each}
        </ol>
    </section>

    <section class="two-col">
        <div>
            <h2>Skills</h2>
            {#each Object.entries(skills) as [category, items]}
                <div class="skill-group">
                    <h3>{category}</h3>
                    <ul>
                        {#each items as item}
                            <li>{item}</li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>

        <div>
            <h2>Languages</h2>
            <p>{languages}</p>
        </div>
    </section>
</div>

<style>
    .resume {
        padding: var(--space-16) var(--space-8);
        max-width: var(--max-w-content);
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: var(--space-16);
    }

    header {
        display: flex;
        justify-content: space-between;
        h1 {
            font-size: var(--text-4xl);
            font-weight: 400;
            letter-spacing: -0.02em;
            margin-bottom: var(--space-2);
        }
        .photo {
            width: 256px;
        }
    }

    .tagline {
        color: var(--color-text-muted);
        font-size: var(--text-lg);
    }

    h2 {
        font-size: var(--text-xs);
        font-weight: 500;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--color-text-muted);
        font-variation-settings: "opsz" var(--font-opsz-body);
        margin-bottom: var(--space-8);
        padding-bottom: var(--space-3);
        border-bottom: 1px solid var(--color-border);
    }

    .entries {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: var(--space-8);
    }

    .entry-header {
        display: flex;
        align-items: baseline;
        gap: var(--space-3);
        margin-bottom: var(--space-1);
    }

    .period {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        white-space: nowrap;
        font-variation-settings: "opsz" var(--font-opsz-body);
    }

    .company {
        font-size: var(--text-base);
        font-weight: 500;
        text-decoration: none;
    }

    a.company:hover {
        color: var(--color-accent-warm);
    }

    .title {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        margin-bottom: var(--space-2);
        font-variation-settings: "opsz" var(--font-opsz-body);
    }

    .description {
        font-size: var(--text-base);
        margin-bottom: var(--space-2);
    }

    .highlights {
        list-style: none;
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        gap: var(--space-1) var(--space-4);
    }

    .highlights li {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        font-variation-settings: "opsz" var(--font-opsz-body);
    }

    .highlights li::before {
        content: "— ";
    }

    .two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-8);
    }

    .skill-group {
        margin-bottom: var(--space-6);
    }

    h3 {
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--color-text-muted);
        font-variation-settings: "opsz" var(--font-opsz-body);
        margin-bottom: var(--space-2);
    }

    .skill-group ul {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1) var(--space-3);
    }

    .skill-group li,
    .two-col p {
        font-size: var(--text-sm);
    }

    /* Print */
    @media print {
        .resume {
            padding: 0;
            gap: var(--space-8);
        }

        h2 {
            margin-bottom: var(--space-4);
        }

        .entries {
            gap: var(--space-6);
        }

        a.company {
            color: inherit;
            text-decoration: none;
        }
    }
</style>
