// The entire elementary-cellular-automaton simulator: a rule is one byte,
// applied locally to every cell. Shared by the live <Hero> and the cover
// generator (gen-cover.mjs) so there is exactly one copy of "the code".

/**
 * Expand a rule number (0–255) into its 8-entry lookup table, indexed by the
 * 3-bit neighbourhood `(l << 2) | (c << 1) | r`.
 * @param {number} n
 * @returns {Uint8Array}
 */
export function ruleTable(n) {
    const t = new Uint8Array(8);
    for (let i = 0; i < 8; i++) t[i] = (n >> i) & 1;
    return t;
}

/**
 * Compute the next generation from a row, wrapping at both edges (toroidal).
 * @param {Uint8Array} row
 * @param {Uint8Array} table
 * @returns {Uint8Array}
 */
export function nextRow(row, table) {
    const n = row.length;
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        const l = row[(i - 1 + n) % n];
        const c = row[i];
        const r = row[(i + 1) % n];
        out[i] = table[(l << 2) | (c << 1) | r];
    }
    return out;
}
