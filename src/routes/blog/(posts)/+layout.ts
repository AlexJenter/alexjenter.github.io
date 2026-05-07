import type { LayoutLoad } from './$types';
import type { PostFrontmatter } from '$lib';

export const load = (({ url }) => {
	const modules = import.meta.glob('/src/routes/blog/**/+page.md', { eager: true });
	const slug = url.pathname.split('/').filter(Boolean).at(-1);
	const mod = Object.entries(modules).find(([path]) =>
		path.includes(`/${slug}/+page.md`)
	)?.[1] as { metadata: PostFrontmatter } | undefined;

	return {
		title: mod?.metadata?.title,
		date: mod?.metadata?.date,
		description: mod?.metadata?.description
	};
}) satisfies LayoutLoad;
