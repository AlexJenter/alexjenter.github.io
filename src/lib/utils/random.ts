/**
 * Seeded PRNG (mulberry32): returns a `Math.random`-style function yielding
 * floats in [0, 1) — the same sequence for the same seed.
 *
 * Use it for values drawn at component init in prerendered pages: the server
 * and the hydrating client then produce identical output, where `Math.random`
 * would bake one set into the HTML and swap in another on hydration.
 */
export function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
