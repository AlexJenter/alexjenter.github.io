import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url }) => {
	const modules = import.meta.glob('/src/routes/blog/**/+page.md', { eager: true });
	const slug = url.pathname.split('/').filter(Boolean).at(-1);
	const mod = Object.entries(modules).find(([path]) =>
		path.includes(`/${slug}/+page.md`)
	)?.[1] as any;

	return {
		title: mod?.metadata?.title as string | undefined,
		date: mod?.metadata?.date as string | undefined,
		description: mod?.metadata?.description as string | undefined
	};
};
