export type PostFrontmatter = {
	title: string;
	date: string;
	cover?: string;
	description?: string;
	status?: "draft" | "published";
};
