<script lang="ts" module>
    export type Side = "n" | "e" | "s" | "w";

    export interface ThreadNode {
        id: string;
        /** Grid coordinates, not pixels. */
        x: number;
        y: number;
        label: string;
        /** Muted text before the label, e.g. a year. Defaults to the node's number. */
        tag?: string;
        /** Which side of the pin the label sits on. */
        side?: Side;
        /** Source links, drawn as small chips under the label. */
        sources?: ThreadSource[];
    }

    export interface ThreadSource {
        label: string;
        href: string;
    }

    export interface ThreadLink {
        from: string;
        to: string;
        label?: string;
    }

    // Mono at 12px: advance is 0.6em.
    const FONT = 12;
    const ADVANCE = FONT * 0.6;
    const LINE = FONT * 1.2;
    const PIN = 3.5;
    const GAP = 9; // pin to label
    const MARGIN = 8;
    const TAG_AIR = 2; // columns between tag and label
    const MIN_CHARS = 10; // never wrap narrower than this
    const CLEARANCE = LINE; // one empty line between neighbouring label blocks

    // Source chips: mono at 11px, a 1px frame, " ↗" after the label.
    const CHIP_FONT = 11;
    const CHIP_ADVANCE = CHIP_FONT * 0.6;
    const CHIP_H = 18;
    const CHIP_PAD = 6; // inside the frame, left and right
    const CHIP_GAP = 8; // between chips on a row
    const ROW_GAP = 6; // between chip rows
    const CHIP_LEAD = 6; // label to first chip row
    // Hit area: the frame plus half a line above and a full line below.
    const HIT_UP = LINE / 2;
    const HIT_DOWN = LINE;

    /** Greedy row fill. A chip wider than `max` gets a row to itself. */
    function flow<T extends { w: number }>(items: T[], max: number): T[][] {
        const rows: T[][] = [];
        let row: T[] = [];
        let used = 0;
        for (const item of items) {
            const next = row.length ? used + CHIP_GAP + item.w : item.w;
            if (row.length && next > max) {
                rows.push(row);
                row = [item];
                used = item.w;
            } else {
                row.push(item);
                used = next;
            }
        }
        if (row.length) rows.push(row);
        return rows;
    }

    /** Greedy word wrap. Words longer than `max` overflow rather than split. */
    function wrap(text: string, max: number): string[] {
        const lines: string[] = [];
        let line = "";
        for (const word of text.split(" ")) {
            if (line && line.length + 1 + word.length > max) {
                lines.push(line);
                line = word;
            } else {
                line = line ? `${line} ${word}` : word;
            }
        }
        lines.push(line);
        return lines;
    }

    const index = (n: number) => String(n).padStart(2, "0");
</script>

<script lang="ts">
    interface Props {
        nodes: ThreadNode[];
        links: ThreadLink[];
        title: string;
        description?: string;
        /** Pixels per grid unit, at most. Shrinks when the container is narrow. */
        cell?: number;
        /** Gravity on the thread, as a fraction of its length. 0 = taut. */
        sag?: number;
    }

    let {
        nodes,
        links,
        title,
        description,
        cell = 48,
        sag = 0,
    }: Props = $props();

    const uid = $props.id();

    // Unmeasured (prerender, first paint): no wrapping, natural size.
    let measured = $state(0);
    const avail = $derived(measured || Infinity);

    // Positions are explicit, so a typo must fail loudly rather than draw a
    // thread to nowhere.
    const byId = $derived.by(() => {
        const map = new Map<string, ThreadNode & { n: number }>();
        nodes.forEach((node, i) => {
            if (map.has(node.id))
                throw new Error(
                    `ThreadDiagram: duplicate node id "${node.id}"`,
                );
            map.set(node.id, { ...node, n: i + 1 });
        });
        return map;
    });

    /*
     * Layout runs at 1:1 pixels (the svg is never scaled down), so text keeps
     * its size and the diagram re-wraps to fit instead:
     *  1. reserve room for west/east labels, shrink the grid cell to fit;
     *  2. wrap each label to the room left on its side of the pin;
     *  3. walk the nodes top to bottom and push down any that would land on
     *     a neighbour's label, carrying everything below along.
     */
    const layout = $derived.by(() => {
        const list = [...byId.values()];
        const xs = list.map((n) => n.x);
        const minX = Math.min(...xs);
        const spanX = Math.max(...xs) - minX;

        const tagOf = (n: ThreadNode & { n: number }) => n.tag ?? index(n.n);
        // One tag column for the whole diagram, so every label lines up.
        const indent = Math.max(...list.map((n) => tagOf(n).length)) + TAG_AIR;

        const natural = (n: { label: string }) =>
            (indent + n.label.length) * ADVANCE;
        const reserve = (side: Side) =>
            Math.max(
                0,
                ...list
                    .filter((n) => (n.side ?? "e") === side)
                    .map((n) => Math.min(natural(n), 0.4 * avail)),
            );
        const area = avail - 2 * MARGIN - reserve("w") - reserve("e");
        const k =
            spanX === 0 ? cell : Math.max(12, Math.min(cell, area / spanX));
        const left = MARGIN + reserve("w");

        const sized = list.map((nd) => {
            const side = nd.side ?? "e";
            const px = left + (nd.x - minX) * k;
            const py = nd.y * k;
            const room =
                side === "e"
                    ? avail - MARGIN - px - GAP
                    : side === "w"
                      ? px - MARGIN - GAP
                      : 2 * Math.min(px - MARGIN, avail - MARGIN - px);
            const chars = Math.max(MIN_CHARS, Math.floor(room / ADVANCE));
            const lines = wrap(nd.label, chars - indent);
            const w =
                (indent + Math.max(...lines.map((l) => l.length))) * ADVANCE;
            const tag = tagOf(nd);
            const extra = (lines.length - 1) * LINE;

            // Chips flow in the same room as the label text.
            const rows = flow(
                (nd.sources ?? []).map((s) => ({
                    ...s,
                    w: (s.label.length + 2) * CHIP_ADVANCE + 2 * CHIP_PAD,
                })),
                Math.max(0, (chars - indent) * ADVANCE),
            );
            const chipsH = rows.length
                ? rows.length * CHIP_H + (rows.length - 1) * ROW_GAP
                : 0;

            // Label block relative to the pin: x extent, first baseline, y extent.
            const anchor =
                side === "w" ? "end" : side === "e" ? "start" : "middle";
            const dx0 =
                side === "e"
                    ? -PIN
                    : side === "w"
                      ? -GAP - w
                      : Math.min(-PIN, -w / 2);
            const dx1 =
                side === "e"
                    ? GAP + w
                    : side === "w"
                      ? PIN
                      : Math.max(PIN, w / 2);
            const tx = px + (side === "e" ? GAP : side === "w" ? -GAP : 0);
            const b0 =
                side === "n"
                    ? -GAP - (chipsH ? CHIP_LEAD + chipsH : 0) - extra
                    : side === "s"
                      ? GAP + FONT * 0.75
                      : FONT * 0.35;
            const labelBottom = b0 + extra + FONT * 0.25;
            const chipsTop = labelBottom + CHIP_LEAD;
            const chips = rows.flatMap((row, r) => {
                const rowW =
                    row.reduce((sum, c) => sum + c.w, 0) +
                    CHIP_GAP * (row.length - 1);
                let x =
                    side === "e"
                        ? GAP + indent * ADVANCE
                        : side === "w"
                          ? -GAP - rowW
                          : -rowW / 2;
                return row.map((c) => {
                    const chip = {
                        label: c.label,
                        href: c.href,
                        w: c.w,
                        dx: x,
                        dy: chipsTop + r * (CHIP_H + ROW_GAP),
                    };
                    x += c.w + CHIP_GAP;
                    return chip;
                });
            });
            // Top of the first line box (not the glyphs), so a block is whole lines tall.
            const top = Math.min(
                -PIN,
                side === "s" ? -PIN : b0 - (FONT * 0.35 + LINE / 2),
            );
            const bottom = Math.max(
                PIN,
                side === "n" ? PIN : chipsH ? chipsTop + chipsH : labelBottom,
            );
            return {
                ...nd,
                side,
                anchor,
                px,
                py,
                tx,
                lines,
                tag,
                indent,
                chips,
                b0,
                top,
                bottom,
                x0: px + Math.min(dx0, ...chips.map((c) => c.dx)),
                x1: px + Math.max(dx1, ...chips.map((c) => c.dx + c.w)),
            };
        });

        // Top-down relaxation.
        const done: typeof sized = [];
        let shift = 0;
        for (const nd of [...sized].sort((a, b) => a.py - b.py)) {
            for (const prev of done) {
                if (nd.x0 >= prev.x1 || nd.x1 <= prev.x0) continue;
                const push =
                    prev.py +
                    prev.bottom +
                    CLEARANCE -
                    (nd.py + shift + nd.top);
                if (push > 0) shift += push;
            }
            done.push({ ...nd, py: nd.py + shift });
        }
        const placed = list.map((nd) => done.find((d) => d.id === nd.id)!);

        const x0 = Math.min(...placed.map((p) => p.x0)) - MARGIN;
        const y0 = Math.min(...placed.map((p) => p.py + p.top)) - MARGIN;
        const x1 = Math.max(...placed.map((p) => p.x1)) + MARGIN;
        const y1 = Math.max(...placed.map((p) => p.py + p.bottom)) + MARGIN;
        return { placed, box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } };
    });

    const placed = $derived(layout.placed);
    const box = $derived(layout.box);

    const threads = $derived(
        links.map((link) => {
            const a = placed.find((p) => p.id === link.from);
            const b = placed.find((p) => p.id === link.to);
            if (!a)
                throw new Error(
                    `ThreadDiagram: unknown node id "${link.from}"`,
                );
            if (!b)
                throw new Error(`ThreadDiagram: unknown node id "${link.to}"`);
            const len = Math.hypot(b.px - a.px, b.py - a.py);
            const mx = (a.px + b.px) / 2;
            const my = (a.py + b.py) / 2;
            const drop = sag * len;
            const d =
                drop === 0
                    ? `M${a.px} ${a.py}L${b.px} ${b.py}`
                    : `M${a.px} ${a.py}Q${mx} ${my + drop} ${b.px} ${b.py}`;
            // A quadratic's midpoint sits halfway to its control point.
            return { d, lx: mx, ly: my + drop / 2, label: link.label };
        }),
    );
</script>

<figure class="thread" bind:clientWidth={measured}>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="{box.x} {box.y} {box.w} {box.h}"
        style:width="{box.w}px"
        role="group"
        aria-label={title}
        aria-describedby={description ? `${uid}-desc` : undefined}
    >
        {#if description}<desc id="{uid}-desc">{description}</desc>{/if}

        <!-- Each thread rides over the ones before it. The wide bg-coloured
             underlay cuts a gap in them where they cross. -->
        <g aria-hidden="true" fill="none" stroke-linecap="round">
            {#each threads as t, i (i)}
                <path class="gap" d={t.d} />
                <path class="string" d={t.d} />
            {/each}
        </g>

        <g aria-hidden="true">
            {#each placed as p (p.id)}
                <circle class="pin" cx={p.px} cy={p.py} r={PIN} />
            {/each}
        </g>

        <g class="labels">
            {#each threads as t, i (i)}
                {#if t.label}
                    <text
                        class="link-label"
                        x={t.lx}
                        y={t.ly + 4}
                        text-anchor="middle"
                    >
                        {t.label}
                    </text>
                {/if}
            {/each}
            {#each placed as p (p.id)}
                <text y={p.py + p.b0} text-anchor={p.anchor}>
                    {#each p.lines as line, i (i)}
                        <!-- Continuation lines hang under the label, not the tag. -->
                        <tspan
                            x={i > 0 && p.anchor === "start"
                                ? p.tx + p.indent * ADVANCE
                                : p.tx}
                            dy={i > 0 ? LINE : 0}
                            >{#if i === 0}<tspan class="idx">{p.tag}</tspan
                                ><tspan dx={(p.indent - p.tag.length) * ADVANCE}
                                    >{line}</tspan
                                >{:else}{line}{/if}</tspan
                        >
                    {/each}
                </text>
            {/each}
        </g>

        <g class="chips">
            {#each placed as p (p.id)}
                {#each p.chips as c (c.href)}
                    {@const cx = p.px + c.dx}
                    {@const cy = p.py + c.dy}
                    <!-- The arrow is decoration: the link's name is its label. -->
                    <a
                        class="chip"
                        href={c.href}
                        rel="noopener"
                        aria-label={c.label}
                    >
                        <rect
                            class="hit"
                            x={cx - CHIP_GAP / 2}
                            y={cy - HIT_UP}
                            width={c.w + CHIP_GAP}
                            height={HIT_UP + CHIP_H + HIT_DOWN}
                        />
                        <rect
                            class="frame"
                            x={cx}
                            y={cy}
                            width={c.w}
                            height={CHIP_H}
                            rx="2"
                        />
                        <text
                            x={cx + CHIP_PAD}
                            y={cy + CHIP_H / 2 + CHIP_FONT * 0.35}
                            >{c.label} ↗</text
                        >
                    </a>
                {/each}
            {/each}
        </g>
    </svg>
</figure>

<style>
    .thread {
        margin: 0;
    }

    svg {
        display: block;
        max-width: 100%;
        height: auto;
        overflow: visible;
    }

    .string {
        stroke: var(--color-accent-warm);
        stroke-width: 1.5;
        vector-effect: non-scaling-stroke;
    }

    .gap {
        stroke: var(--color-bg);
        stroke-width: 6;
        vector-effect: non-scaling-stroke;
    }

    .pin {
        fill: var(--color-accent-warm);
    }

    .labels {
        font-family: var(--font-mono);
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        fill: var(--color-text);
    }

    .idx {
        fill: var(--color-text-muted);
    }

    /* Source chips use the controls' ladder: frame dim at rest, text on
       hover, warm on keyboard focus. */
    .chips {
        font-family: var(--font-mono);
        font-size: 11px;
        font-variant-numeric: tabular-nums;
    }

    .chip {
        outline: none;
        cursor: pointer;
        /* On the link, not the text: the site's underline propagates down. */
        text-decoration: none;
    }

    .hit {
        fill: transparent;
        pointer-events: all;
    }

    .frame {
        fill: none;
        stroke: var(--color-text-dim);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
    }

    .chip text {
        fill: var(--color-text-muted);
    }

    .chip:hover .frame {
        stroke: var(--color-text);
    }

    .chip:hover text {
        fill: var(--color-text);
    }

    .chip:focus-visible .frame {
        stroke: var(--color-accent-warm);
        stroke-width: 2;
    }

    .chip:focus-visible text {
        fill: var(--color-accent-warm);
    }

    .link-label {
        fill: var(--color-text-muted);
        font-size: 11px;
        paint-order: stroke;
        stroke: var(--color-bg);
        stroke-width: 4px;
        stroke-linejoin: round;
    }
</style>
