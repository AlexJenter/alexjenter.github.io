// Generate this post's cover by running the article's own automaton.
// The cover *is* the code: same nextRow() the live <Hero> uses (see ca.js).
//
// Usage:
//   node gen-cover.mjs                          # rule 110, 31×31, single seed
//   node gen-cover.mjs --rule 30 --res 41
//   node gen-cover.mjs --seed random --density 0.5
//   node gen-cover.mjs --seed 0001011000        # explicit bit string, centred
//   node gen-cover.mjs --rows 48 --out preview.svg
//
// Note: --seed random is non-deterministic, so for the committed cover.svg
// prefer "single" or an explicit bit string (reproducible).

import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { ruleTable, nextRow } from "./ca.js";

const here = dirname(fileURLToPath(import.meta.url));

const { values } = parseArgs({
    options: {
        rule: { type: "string", default: "110" }, // 0–255
        res: { type: "string", default: "31" }, // cells across
        rows: { type: "string" }, // generations (default: square, = res)
        seed: { type: "string", default: "single" }, // single | random | <0/1 string>
        density: { type: "string", default: "0.5" }, // fraction on, for --seed random
        out: { type: "string", default: "cover.svg" },
    },
});

const rule = Number(values.rule);
const cols = Number(values.res);
const rows = values.rows ? Number(values.rows) : cols;
const density = Number(values.density);

// The seed is the initial row — sculpt it however you like.
function makeSeed(spec) {
    const row = new Uint8Array(cols);
    if (spec === "single") {
        row[cols >> 1] = 1; // one cell, dead centre
    } else if (spec === "random") {
        for (let i = 0; i < cols; i++) row[i] = Math.random() < density ? 1 : 0;
    } else if (/^[01]+$/.test(spec)) {
        const start = Math.max(0, (cols - spec.length) >> 1); // centre it
        for (let i = 0; i < spec.length && start + i < cols; i++)
            row[start + i] = spec[i] === "1" ? 1 : 0;
    } else {
        throw new Error(`Unrecognised --seed "${spec}" (use single | random | a 0/1 string)`);
    }
    return row;
}

// Run the automaton, keeping every generation.
const table = ruleTable(rule);
const history = [];
let cur = makeSeed(values.seed);
for (let y = 0; y < rows; y++) {
    history.push(cur);
    cur = nextRow(cur, table);
}

// Serialise into the shared cover template (100×100, dark-mode aware).
const cellW = 100 / cols;
const cellH = 100 / rows;
const r = (n) => Number(n.toFixed(3));

let rects = "";
for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
        if (!history[y][x]) continue;
        rects += `<rect x="${r(x * cellW)}" y="${r(y * cellH)}" width="${r(cellW)}" height="${r(cellH)}"/>`;
    }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" shape-rendering="crispEdges">
  <style>
    .bg   { fill: #f5f4f0; }
    .cell { fill: #1a1916; }
    @media (prefers-color-scheme: dark) {
      .bg   { fill: #111110; }
      .cell { fill: #e8e6e0; }
    }
  </style>
  <rect class="bg" width="100" height="100"/>
  <g class="cell">${rects}</g>
</svg>
`;

writeFileSync(resolve(here, values.out), svg);
console.log(`rule ${rule} · ${cols}×${rows} · seed "${values.seed}" → ${values.out}`);
