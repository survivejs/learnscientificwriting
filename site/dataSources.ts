import { parseLatex } from "https://deno.land/x/gustwind@v0.79.0/htmlisp/parsers/latex/parseLatex.ts";
import { el } from "https://deno.land/x/gustwind@v0.79.0/htmlisp/parsers/latex/defaultExpressions.ts";
import type { DataSourcesApi } from "https://deno.land/x/gustwind@v0.79.0/types.ts";
import getMarkdown from "./transforms/markdown.ts";

function init({ load }: DataSourcesApi) {
  const markdown = getMarkdown(load);

  async function processMarkdown(
    filename: string,
    o?: { skipFirstLine: boolean },
  ) {
    // Drop title from the first line
    // This is not cleanest solution since sometimes you have something else there!
    // TODO: It would be better to check for the existence of # before removing the line
    const lines = await load.textFile(filename);

    return markdown(
      o?.skipFirstLine ? lines.split("\n").slice(1).join("\n") : lines,
    );
  }

  async function indexBook(
    chapterFile: string,
    appendixFile: string,
    o: { flatten: boolean },
  ) {
    const chaptersText = await load.textFile(chapterFile);
    const appendicesText = await load.textFile(appendixFile);
    const chapters = parseBookIndex(chaptersText);
    const appendices = parseBookIndex(appendicesText);

    if (o.flatten) {
      return chapters.concat(appendices);
    }

    return { chapters, appendices };
  }

  // TODO: Attach prev/next info during indexing pass
  async function processChapter(
    // { path, previous, next }: {
    { path }: {
      path: string;
      // previous: MarkdownWithFrontmatter;
      // next: MarkdownWithFrontmatter;
    },
  ) {
    // TODO: Convert chapterText to HTML
    const chapterText = await load.textFile(path);

    return {};
  }

  return { indexBook, processMarkdown, processChapter };
}

function parseBookIndex(text: string) {
  const ast = parseLatex(text, {
    singles: {
      chapter: el("title"),
      label: el("label"),
      input: el("slug"),
    },
  });

  const titles = ast.filter((n) => n.type === "title").map((n) =>
    n.children[0]
  );
  const slugs = ast.filter((n) => n.type === "slug").map((n) =>
    // @ts-expect-error This should be a string
    n.children[0].split("chapters/")[1].split("-").slice(1).join("-")
  );
  const paths = ast.filter((n) => n.type === "slug").map((n) => n.children[0]);

  return titles.map((title, i) => ({
    title,
    slug: slugs[i],
    path: `book/${paths[i]}.tex`,
  }));
}

export { init };
