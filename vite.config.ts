import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig, type Plugin } from 'vite';

// Vite 8 (Rolldown) tree-shakes `import 'svelte/internal/flags/legacy'`
// because svelte-tweakpane-ui declares "sideEffects: false" and Svelte
// has no "sideEffects" field. That import calls enable_legacy_mode_flag()
// which sets legacy_mode_flag = true — required for beforeUpdate() and
// other Svelte 4-style lifecycle hooks used by svelte-tweakpane-ui.
//
// Fix: initialize legacy_mode_flag to true in flags/index.js directly,
// so it's already true regardless of whether the import survives bundling.
// Rolldown may still fold `legacy_mode_flag = true` at usage sites, which
// is fine — runes components pass t=true to component init so they still
// get l=null, and legacy components pass t=false and get l={...}.
const svelteLegacyFlagInit: Plugin = {
	name: 'svelte-legacy-flag-init',
	enforce: 'pre',
	transform(code, id) {
		if (id.includes('svelte') && id.endsWith('flags/index.js')) {
			return {
				code: code.replace(
					'export let legacy_mode_flag = false;',
					'export let legacy_mode_flag = true;'
				)
			};
		}
	}
};

export default defineConfig({
	plugins: [enhancedImages(), sveltekit(), svelteLegacyFlagInit]
});
