import { htmlispToHTMLSync } from "https://deno.land/x/gustwind@v0.80.0/htmlisp/htmlispToHTMLSync.ts";
import { astToHTMLSync } from "https://deno.land/x/gustwind@v0.80.0/htmlisp/utilities/astToHTMLSync.ts";
import { parseLatex } from "https://deno.land/x/gustwind@v0.80.0/htmlisp/parsers/latex/parseLatex.ts";
import { parseBibtexCollection } from "https://deno.land/x/gustwind@v0.80.0/htmlisp/parsers/latex/parseBibtexCollection.ts";
import {
  blocks,
  cites,
  doubles,
  el,
  lists,
  singles,
} from "https://deno.land/x/gustwind@v0.80.0/htmlisp/parsers/latex/defaultExpressions.ts";
import type { DataSourcesApi } from "https://deno.land/x/gustwind@v0.80.0/types.ts";
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
    o?: { flatten: boolean },
  ) {
    const chaptersText = await load.textFile(chapterFile);
    const appendicesText = await load.textFile(appendixFile);
    const chapters = parseBookIndex(chaptersText);
    const appendices = parseBookIndex(appendicesText);

    if (o?.flatten) {
      return chapters.concat(appendices);
    }

    return { chapters, appendices };
  }

  // TODO: Attach prev/next info during indexing pass
  async function processChapter(
    // { path, previous, next }: {
    { path, title }: {
      path: string;
      title: string;
      // previous: MarkdownWithFrontmatter;
      // next: MarkdownWithFrontmatter;
    },
  ) {
    // TODO: Load this once at parent instead to save effort
    const bibtexText = await load.textFile(
      "book/chapters/bibliography/english.bib",
    );
    const bibtex = parseBibtexCollection(bibtexText);

    const chapterText = await load.textFile(path);
    // TODO: Add cites to singles and connect it to bibtex
    const ast = parseLatex(chapterText, {
      blocks,
      doubles,
      lists,
      singles,
    });
    const content = astToHTMLSync(ast, htmlispToHTMLSync);

    return {
      data: {
        title,
        author: {
          name: "Juho Vepsäläinen",
          twitter: "https://x.com/bebraw",
        },
      },
      tableOfContents: [], // TODO: Generate based on AST
      content,
      // TODO: Generate during indexing
      previous: "TODO",
      next: "TODO",
    };
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
