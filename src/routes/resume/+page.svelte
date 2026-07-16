<script lang="ts">
    import { work, education, languages, skills } from "$lib/data/resume";
    import EntryHeader from "./EntryHeader.svelte";
    import Seo from "$lib/components/Seo.svelte";
</script>

<Seo
    title="Resume — Alex Jenter"
    description="Résumé of Alex Jenter — web developer with a background in design."
/>

<div class="resume">
    <header>
        <div>
            <h1>Alex Jenter</h1>
            <p class="tagline">Web developer with a background in design</p>
        </div>
    </header>

    <section>
        <h2>Work</h2>
        <ol class="entries">
            {#each work as entry}
                <li class="entry">
                    <EntryHeader
                        period={entry.period}
                        url={entry.url}
                        company={entry.company}
                    />
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

    <section id="education">
        <h2>Education</h2>
        <ol class="entries">
            {#each education as entry}
                <li class="entry">
                    <EntryHeader
                        period={entry.period}
                        url={entry.url}
                        company={entry.institution}
                    />
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
    @page {
        size: A4 portrait;
        margin: 20mm 25mm;
    }

    @media print {
        :global(html) {
            font-size: 10pt;
        }

        :global(:root) {
            --color-bg: white;
            --color-surface: white;
            --color-border: #ccc;
            --color-text: black;
            --color-text-muted: #444;
        }

        .resume {
            padding: 0;
            max-width: none;
            gap: var(--space-8);
            background-color: transparent;
        }

        h2 {
            font-size: 8pt;
            margin-bottom: var(--space-4);
            break-after: avoid;
        }

        .entries {
            gap: var(--space-6);
        }

        .entry {
            break-inside: avoid;
        }

        a[href]::after {
            content: " (" attr(href) ")";
            font-size: 0.75em;
            color: #666;
        }

        #education {
            break-before: page;
        }

        .two-col {
            grid-template-columns: 1fr;
        }
    }
</style>
