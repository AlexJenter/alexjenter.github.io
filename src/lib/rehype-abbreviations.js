/**
 * Rehype plugin: wrap the abbreviations a post declares in <abbr>.
 *
 * The post lists them in its frontmatter:
 *
 *   ---
 *   abbr:
 *     LLM: Large Language Model
 *     DOM: Document Object Model
 *   ---
 *
 * Every whole-word `LLM` in the prose (not in code, links or maths) becomes
 *
 *   <abbr class="has-tip" aria-describedby="abbr-tip-N">LLM
 *     <span id="abbr-tip-N" class="link-tip" aria-hidden="true">Large Language Model</span>
 *   </abbr>
 *
 * which reuses the .link-tip bubble from rehype-link-tooltips. The first
 * occurrence of each entry is also focusable (tabindex 0), so keyboard and
 * touch users can reach the expansion without a tab stop for every repeat.
 * A plural ("LLMs") wraps only the "LLM" and leaves the "s" outside.
 *
 * Matching is case-sensitive. A malformed glossary throws; an entry that never
 * appears in the text only warns, since it may just have been edited out.
 */
const SKIP = new Set(['code', 'pre', 'a', 'abbr', 'script', 'style', 'svg', 'textarea']);
const SKIP_CLASS = new Set(['katex', 'link-tip']);
const WORD = '[\\p{L}\\p{N}]';

export default function rehypeAbbreviations() {
	return (/** @type {any} */ tree, /** @type {any} */ file) => {
		const glossary = file.data?.fm?.abbr;
		if (glossary === undefined) return;

		const where = file.path ?? 'post';
		if (!glossary || typeof glossary !== 'object' || Array.isArray(glossary)) {
			throw new Error(
				`${where}: frontmatter "abbr" must map each abbreviation to its expansion`
			);
		}
		for (const [key, expansion] of Object.entries(glossary)) {
			if (typeof expansion !== 'string' || !expansion.trim()) {
				throw new Error(`${where}: abbr "${key}" needs a text expansion, got ${JSON.stringify(expansion)}`);
			}
		}

		// Longest first, so "HTML5" wins over "HTML".
		const keys = Object.keys(glossary).sort((a, b) => b.length - a.length);
		if (!keys.length) return;
		const pattern = new RegExp(
			`(?<!${WORD})(${keys.map(escapeRegExp).join('|')})(?=s(?!${WORD})|(?!${WORD}))`,
			'gu'
		);

		const seen = new Set();
		let n = 0;

		const abbr = (/** @type {string} */ key) => {
			const id = `abbr-tip-${++n}`;
			const first = !seen.has(key);
			seen.add(key);
			return {
				type: 'element',
				tagName: 'abbr',
				properties: {
					className: ['has-tip'],
					'aria-describedby': id,
					...(first ? { tabIndex: 0 } : {})
				},
				children: [
					{ type: 'text', value: key },
					{
						type: 'element',
						tagName: 'span',
						properties: { id, className: ['link-tip'], 'aria-hidden': 'true' },
						children: [{ type: 'text', value: glossary[key] }]
					}
				]
			};
		};

		// Splits one text node around its matches; null when there are none.
		const split = (/** @type {string} */ value) => {
			/** @type {any[]} */
			const parts = [];
			let last = 0;
			for (const match of value.matchAll(pattern)) {
				if (match.index > last) parts.push({ type: 'text', value: value.slice(last, match.index) });
				parts.push(abbr(match[1]));
				last = match.index + match[1].length;
			}
			if (!parts.length) return null;
			if (last < value.length) parts.push({ type: 'text', value: value.slice(last) });
			return parts;
		};

		const walk = (/** @type {any} */ node) => {
			if (!Array.isArray(node.children)) return;
			if (node.type === 'element' && skipped(node)) return;

			node.children = node.children.flatMap((/** @type {any} */ child) => {
				if (child.type === 'text') return split(child.value) ?? [child];
				walk(child);
				return [child];
			});
		};

		walk(tree);

		const unused = keys.filter((key) => !seen.has(key));
		if (unused.length) {
			console.warn(`${where}: abbr entries never used in the text: ${unused.join(', ')}`);
		}
	};
}

/** @param {any} node */
function skipped(node) {
	if (SKIP.has(node.tagName)) return true;
	const classes = node.properties?.className;
	return Array.isArray(classes) && classes.some((c) => SKIP_CLASS.has(c));
}

/** @param {string} text */
function escapeRegExp(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
