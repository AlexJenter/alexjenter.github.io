import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig, type Plugin } from 'vite';

// Vite 8 (Rolldown) aggressively tree-shakes side-effect-only imports from
// packages without a "sideEffects" field. Svelte omits this field, so
// `import 'svelte/internal/flags/legacy'` — which calls enable_legacy_mode_flag()
// to enable legacy component support (required by beforeUpdate() in
// svelte-tweakpane-ui) — gets removed.
//
// This plugin transforms the flags/legacy module to assign to globalThis,
// which Rolldown cannot tree-shake (it's a global side effect).
const preserveSvelteLegacyFlag: Plugin = {
	name: 'preserve-svelte-legacy-flag',
	enforce: 'pre',
	transform(code, id) {
		if (id.includes('svelte') && id.endsWith('flags/legacy.js')) {
			return {
				code: code.replace(
					'enable_legacy_mode_flag();',
					'(globalThis.__svelteLegacyMode = true) && enable_legacy_mode_flag();'
				)
			};
		}
	}
};

export default defineConfig({
	plugins: [enhancedImages(), sveltekit(), preserveSvelteLegacyFlag]
});
