import type { PostFrontmatter } from '$lib';

export const load = () => {
  const modules = import.meta.glob("/src/routes/blog/**/+page.md", {
    eager: true,
  });
  const images = import.meta.glob(
    "/src/routes/blog/**/*.{jpg,jpeg,png,webp,avif}",
    {
      eager: true,
      query: { enhanced: true },
      import: "default",
    },
  ) as Record<string, any>;
  const svgs = import.meta.glob("/src/routes/blog/**/*.svg", {
    eager: true,
    import: "default",
  }) as Record<string, string>;

  const posts = Object.entries(modules)
    .map(([path, mod]: [string, any]) => {
      const meta = mod.metadata as PostFrontmatter;
      const postDir = path.replace("/+page.md", "");
      const coverFile = meta.cover?.replace("./", "");
      const fullPath = coverFile ? `${postDir}/${coverFile}` : undefined;

      const cover = fullPath
        ? coverFile!.endsWith(".svg")
          ? { svg: true, src: svgs[fullPath] as string }
          : { svg: false, src: images[fullPath] }
        : undefined;

      return {
        slug: path.split("/").at(-2)!,
        title: meta.title,
        date: meta.date,
        description: meta.description,
        cover,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((p) => ({
      ...p,
      date: new Date(p.date).toLocaleDateString(),
    }));

  return { posts };
};
