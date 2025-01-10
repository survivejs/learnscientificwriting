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

  async function indexBook(chapterFile: string, appendixFile: string) {
    const chaptersText = await load.textFile(chapterFile);
    const appendicesText = await load.textFile(appendixFile);
    const chapters = parseBookIndex(chaptersText);
    const appendices = parseBookIndex(appendicesText);

    return { chapters, appendices };
  }

  return { indexBook, processMarkdown };
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

  return titles.map((title, i) => ({ title, slug: slugs[i] }));
}

export { init };
