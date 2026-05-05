export const load = () => {
	const modules = import.meta.glob('/src/routes/blog/**/+page.md', { eager: true });

	const posts = Object.entries(modules)
		.map(([path, mod]: [string, any]) => ({
			slug: path.split('/').at(-2)!,
			title: mod.metadata.title as string,
			date: mod.metadata.date as string,
			description: mod.metadata.description as string | undefined
		}))
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return { posts };
};
