import type { LayoutLoad } from './$types';
import type { PostFrontmatter } from '$lib';

export const load = (({ url }) => {
	const mdModules = import.meta.glob('/src/routes/blog/**/+page.md', { eager: true });
	const heroModules = import.meta.glob('/src/routes/blog/**/Hero.svelte', { eager: true });

	const slug = url.pathname.split('/').filter(Boolean).at(-1) ?? '';

	const mdMod = Object.entries(mdModules).find(([path]) =>
		path.includes(`/${slug}/+page.md`)
	)?.[1] as { metadata: PostFrontmatter } | undefined;

	const hasHero = Object.keys(heroModules).some((p) => p.includes(`/${slug}/Hero.svelte`));

	return {
		title: mdMod?.metadata?.title,
		date: mdMod?.metadata?.date,
		description: mdMod?.metadata?.description,
		slug,
		hasHero
	};
}) satisfies LayoutLoad;
