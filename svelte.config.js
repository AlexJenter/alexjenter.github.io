import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mdsvex, code_highlighter } from "mdsvex";
import remarkFootnotes from "remark-footnotes";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeLinkTooltips from "./src/lib/rehype-link-tooltips.js";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // mdsvex 0.12 still emits <script context="module"> for frontmatter;
  // nothing in our own source to fix. Drop only that warning, only there.
  onwarn: (warning, handler) => {
    if (
      warning.code === "script_context_deprecated" &&
      /\.(md|svx)$/.test(warning.filename ?? "")
    )
      return;
    handler(warning);
  },
  extensions: [".svelte", ".svx", ".md"],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: [".svx", ".md"],
      highlight: {
        // mdsvex's default Prism output, plus the fence language as
        // data-lang on <pre> so global.css can label the block.
        highlighter: async (code, lang, meta) => {
          const html = await code_highlighter(code, lang, meta);
          return lang && /^[\w+#-]+$/.test(lang)
            ? html.replace("<pre ", `<pre data-lang="${lang}" `)
            : html;
        },
      },
      remarkPlugins: [remarkFootnotes, remarkMath],
      rehypePlugins: [rehypeKatex, rehypeLinkTooltips],
    }),
  ],
  compilerOptions: {
    runes: ({ filename }) =>
      filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
  },
  kit: {
    adapter: adapter({
      fallback: "404.html",
    }),
    prerender: {
      // Every route is a prerender entry, and draft posts and the /dev
      // tools answer 404 outside dev (see (posts)/+layout.ts and
      // dev/+layout.ts): skip those rather than fail. A 404 reached
      // through a link still fails.
      handleHttpError: ({ status, path, referrer, message }) => {
        const devOnly = path.startsWith("/lab/") || path.startsWith("/dev/");
        if (status === 404 && !referrer && devOnly) return;
        throw new Error(message);
      },
    },
  },
};

export default config;
