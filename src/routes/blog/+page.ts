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
  );

  const posts = Object.entries(modules)
    .map(([path, mod]: [string, any]) => {
      const postDir = path.replace("/+page.md", "");
      const coverFile = mod.metadata.cover?.replace("./", "");
      const cover = coverFile
        ? images[`${postDir}/${coverFile}`]
        : undefined;

      return {
        slug: path.split("/").at(-2)!,
        title: mod.metadata.title as string,
        date: mod.metadata.date as string,
        description: mod.metadata.description as string | undefined,
        cover,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { posts };
};
