/**
 * Rehype plugin: turn a markdown link's title into a styled tooltip.
 *
 * Markdown lets you write `[text](url "a title")`, which normally renders as a
 * `<a title="…">` — a browser-native tooltip you can't style. This rewrites the
 * HTML tree (before Svelte compiles it) so the title becomes a real element we
 * can style with CSS instead:
 *
 *   <a href="…">text</a>                     ->  unchanged (no title)
 *   <a href="…" title="…">text</a>           ->  <a class="has-tip"
 *                                                    aria-describedby="link-tip-N">text
 *                                                    <span id="link-tip-N" class="link-tip"
 *                                                          aria-hidden="true">…</span>
 *                                                 </a>
 *
 * `aria-hidden` keeps the tooltip text out of the link's accessible *name*,
 * while `aria-describedby` still exposes it as the link's *description* — so
 * screen-reader users get the aside on focus, and sighted users get it on hover.
 */
export default function rehypeLinkTooltips() {
	return (tree) => {
		let n = 0;

		const walk = (node) => {
			const title = node.tagName === 'a' && node.properties && node.properties.title;
			if (typeof title === 'string' && title.trim()) {
				delete node.properties.title;

				const id = `link-tip-${++n}`;
				node.properties.className = [...toArray(node.properties.className), 'has-tip'];
				node.properties['aria-describedby'] = id;

				node.children.push({
					type: 'element',
					tagName: 'span',
					properties: { id, className: ['link-tip'], 'aria-hidden': 'true' },
					children: [{ type: 'text', value: title }]
				});
			}

			if (Array.isArray(node.children)) node.children.forEach(walk);
		};

		walk(tree);
	};
}

function toArray(value) {
	if (value == null) return [];
	return Array.isArray(value) ? value : [value];
}
