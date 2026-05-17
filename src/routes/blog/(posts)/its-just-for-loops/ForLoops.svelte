<script lang="ts">
    import katex from "katex";
    import "katex/dist/katex.min.css";

    const BOUND = "#e05c75";
    const VAR = "#56d6b3";
    const EXPR = "#6bb8f5";

    const rows = [
        {
            label: "Summation",
            sublabel: "capital sigma",
            symbol: "sum",
            varName: "sum",
            initVal: "0",
            start: "0",
            end: "4",
            op: "+=",
            exprMath: "3n",
            exprCode: "3*n",
        },
        {
            label: "Product",
            sublabel: "capital pi",
            symbol: "prod",
            varName: "prod",
            initVal: "1",
            start: "1",
            end: "4",
            op: "*=",
            exprMath: "2n",
            exprCode: "2*n",
        },
    ] as const;

    const rendered = rows.map((r) => ({
        ...r,
        mathHtml: katex.renderToString(
            `\\displaystyle\\${r.symbol}_{\\textcolor{${VAR}}{n=${r.start}}}^{\\textcolor{${BOUND}}{${r.end}}} \\textcolor{${EXPR}}{${r.exprMath}}`,
            { displayMode: true, throwOnError: false },
        ),
    }));
</script>

<div class="container">
    {#each rendered as row, i}
        {#if i > 0}<div class="divider"></div>{/if}
        <div class="row">
            <div class="label">
                <strong>{row.label}</strong>
                <span class="sublabel">({row.sublabel})</span>
            </div>
            <div class="math">
                {@html row.mathHtml}
            </div>
            <pre
                class="code"
            ><span>{row.varName} = {row.initVal};</span>
<span>for( <span style="color:{VAR}">n={row.start}</span>; <span style="color:{VAR}">n</span>&lt;=<span style="color:{BOUND}">{row.end}</span>; <span style="color:{VAR}">n</span>++ )</span>
<span>    {row.varName} {row.op} <span style="color:{EXPR}">{row.exprCode}</span>;</span></pre>
        </div>
    {/each}
</div>

<style>
    .container {
        background: #151c2c;
        border-radius: var(--radius-lg);
        overflow: hidden;
        margin: var(--space-8) 0;
    }

    .divider {
        height: 1px;
        background: #2a3650;
    }

    .row {
        display: grid;
        grid-template-columns: 13ch 1fr 1fr;
        align-items: center;
        gap: var(--space-6);
        padding: var(--space-8);
    }

    .label {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        color: white;
        font-family: var(--font-serif);
    }

    .label strong {
        font-size: var(--text-lg);
        font-weight: 700;
    }

    .sublabel {
        font-size: var(--text-sm);
        opacity: 0.55;
    }

    .math {
        text-align: center;
    }

    .math :global(.katex) {
        color: white;
        font-size: 2.6em;
    }

    .math :global(.katex-display) {
        margin: 0;
    }

    .code {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        line-height: 1.9;
        color: #c8c6be;
        margin: 0;
        background: transparent;
        border: none;
        white-space: pre;
    }

    @media (max-width: 640px) {
        .row {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
        }

        .label {
            grid-column: 1 / -1;
        }
    }
</style>
