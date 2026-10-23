import { sveltekit } from "@sveltejs/kit/vite";
import { enhancedImages } from "@sveltejs/enhanced-img";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [enhancedImages(), sveltekit()],
  server: {
    // Build output only: .svelte-kit/generated must stay watched, it is
    // what picks up new routes. Bare names don't match the files inside.
    watch: { ignored: ["**/build/**", "**/.svelte-kit/output/**"] },
  },
});
