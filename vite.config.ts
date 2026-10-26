import { sveltekit } from "@sveltejs/kit/vite";
import { enhancedImages } from "@sveltejs/enhanced-img";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [enhancedImages(), sveltekit()],
  // Pre-bundle up front: otherwise the first visit to a diagram page finds
  // d3, re-optimizes and forces a full reload.
  optimizeDeps: { include: ["d3"] },
  server: {
    // Build output only: .svelte-kit/generated must stay watched, it is
    // what picks up new routes. Bare names don't match the files inside.
    watch: { ignored: ["**/build/**", "**/.svelte-kit/output/**"] },
  },
});
