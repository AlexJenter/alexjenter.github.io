<!-- Type specimen. Headings are class-based (not h1–h4 elements) so the
     workbench page keeps a sane document outline; the classes include the
     same prose-h* mixins the lab post layout applies to real headings. -->

<div class="specimen">
    <section>
        <h3 class="label">heading waterfall</h3>

        <p class="anno">h1 · text-4xl</p>
        <p class="h1">Weighted Voronoi stippling</p>

        <p class="anno">h2 · text-2xl</p>
        <p class="h2">Relaxing toward the centroid</p>

        <p class="anno">h3 · text-xl</p>
        <p class="h3">Rejection sampling the density map</p>

        <p class="anno">h4 · text-lg</p>
        <p class="h4">Edge cases at the boundary</p>
    </section>

    <section>
        <h3 class="label">text blocks</h3>

        <div class="prose">
            <p>
                Body text is <strong>Fraunces</strong> at low optical size — rounder and
                built for reading, with <em>WONK</em> left on so the quirks survive.
                Links get a <a href="/lab">warm accent on hover</a>, and inline code
                like <code>theme.resolved</code> sits in a surface chip.
            </p>
            <p>
                A second paragraph to show rhythm: spacing between blocks comes from
                the space scale, not line-height tricks. The measure caps at
                <code>--max-w-content</code> (72ch) in real posts.
            </p>

            <ul>
                <li>unordered list, first item</li>
                <li>
                    second item with a longer line to see how wrapped text hangs under
                    the marker
                </li>
                <li>third item</li>
            </ul>

            <ol>
                <li>ordered list</li>
                <li>counts upward</li>
            </ol>

            <hr />

            <!-- Hand-tokenized so the Prism palette shows without mdsvex. -->
            <pre><code><span class="token keyword">const</span> theme = <span
                    class="token function">resolve</span><span class="token punctuation"
                    >(</span><span class="token string">"system"</span><span
                    class="token punctuation">);</span> <span class="token comment"
                    >// syntax palette, both themes</span></code></pre>
        </div>
    </section>
</div>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .specimen {
        display: flex;
        flex-direction: column;
        gap: var(--space-12);
        max-width: var(--max-w-content);
    }

    .label {
        @include m.meta-label;
        font-weight: 400;
        color: var(--color-text-muted);
        margin: 0 0 var(--space-4);
    }

    .anno {
        @include m.meta-label;
        color: var(--color-text-muted);
        border-top: 1px solid var(--color-border);
        padding-top: var(--space-2);
        margin: var(--space-6) 0 var(--space-1);
    }

    .h1 {
        @include m.prose-h1;
    }

    .h2 {
        @include m.prose-h2;
    }

    .h3 {
        @include m.prose-h3;
    }

    .h4 {
        @include m.prose-h4;
    }

    /* Specimens sit directly under annotations; the scale's own top margins
       would double up with .anno spacing. */
    .h1,
    .h2,
    .h3,
    .h4 {
        margin-top: 0;
    }

    /* Flow rhythm — mirrors the .post :global() rules in the lab post layout. */
    .prose p {
        margin-bottom: var(--space-4);
    }

    .prose ul,
    .prose ol {
        padding-left: var(--space-6);
        margin-bottom: var(--space-4);
    }

    .prose li {
        margin-bottom: var(--space-2);
    }

    .prose hr {
        border: none;
        border-top: 1px solid var(--color-border);
        margin: var(--space-12) 0;
    }
</style>
