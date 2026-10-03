import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, code_highlighter } from 'mdsvex';
import remarkFootnotes from 'remark-footnotes';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeLinkTooltips from './src/lib/rehype-link-tooltips.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.svx', '.md'],
			highlight: {
				// mdsvex's default Prism output, plus the fence language as
				// data-lang on <pre> so global.css can label the block.
				highlighter: async (code, lang, meta) => {
					const html = await code_highlighter(code, lang, meta);
					return lang && /^[\w+#-]+$/.test(lang)
						? html.replace('<pre ', `<pre data-lang="${lang}" `)
						: html;
				}
			},
			remarkPlugins: [remarkFootnotes, remarkMath],
			rehypePlugins: [rehypeKatex, rehypeLinkTooltips]
		})
	],
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({
			fallback: '404.html'
		})
	}
};

export default config;
