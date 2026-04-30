import {
  astToHTMLSync,
  blocks,
  cites,
  doubles,
  el,
  htmlispToHTMLSync,
  lists,
  parseBibtexCollection,
  parseLatex,
  refs,
  singles,
} from "gustwind/htmlisp";
import type { DataSourcesApi } from "gustwind";
import getMarkdown from "./transforms/markdown.ts";

const environments = {
  ...blocks,
  ...lists,
  comment: {
    container: () => ({ type: "", attributes: {}, children: [] }),
    item: blocks.verbatim.item,
  },
  overbatim: blocks.verbatim,
  table: {
    container: (children: string[]) => ({
      type: "pre",
      attributes: {},
      children,
    }),
    item: blocks.verbatim.item,
  },
  tabular: {
    container: (children: string[]) => ({
      type: "pre",
      attributes: {},
      children,
    }),
    item: blocks.verbatim.item,
  },
};

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

  async function loadBibtex() {
    const bibtexText = await load.textFile(
      "book/chapters/bibliography/english.bib",
    );

    return sanitizeBibtexEntries(parseBibtexCollection(bibtexText));
  }

  async function processChapter(
    { path, title }: {
      path: string;
      title: string;
    },
  ) {
    const bookIndex = await indexBook(
      "./book/chapters.tex",
      "./book/appendices.tex",
      { flatten: true },
    );
    const { previous, next } = getAdjacentEntries(bookIndex, path);

    // TODO: Pass book index here as well since that's needed for label linking
    // TODO: Add proper nesting to gustwind to allow loading any data from a parent
    // const { bibtex } = this.parentDataSources;
    const bibtex = await loadBibtex();

    const chapterText = await load.textFile(path);
    let footnotes = 0;
    const ast = parseLatex(chapterText, {
      blocks: environments,
      doubles,
      // TODO: Connect refs here
      singles: {
        ...singles,
        ...cites(bibtex),
        footnote: (children: HtmlispChild[]) => {
          footnotes++;

          return {
            type: "sup",
            attributes: { title: escapeAttribute(childrenToText(children)) },
            children: [footnotes.toString()],
          };
        },
        ...getRefs(bookIndex),
      },
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
      previous,
      next,
    };
  }

  return { indexBook, loadBibtex, processMarkdown, processChapter };
}

function getRefs(refEntries: { title: string; label: string; slug: string }[]) {
  return {
    ...refs(refEntries),
    nameref: (children: string[]) => {
      const id = children[0];
      const ref = refEntries.find(({ label }) => label === id);

      return {
        type: "a",
        attributes: { href: ref?.slug || "#" },
        children: [ref?.title || id],
      };
    },
  };
}

function getAdjacentEntries(
  entries: { title: string; slug: string; path: string }[],
  path: string,
) {
  const index = entries.findIndex((entry) => entry.path === path);

  return {
    previous: formatAdjacentEntry(entries[index - 1]),
    next: formatAdjacentEntry(entries[index + 1]),
  };
}

function formatAdjacentEntry(
  entry?: { title: string; slug: string },
) {
  if (!entry) {
    return;
  }

  return {
    data: {
      title: entry.title,
      slug: `/book/${entry.slug}/`,
    },
  };
}

function sanitizeBibtexEntries(
  entries: Record<string, { fields?: Record<string, string> }>,
) {
  return Object.fromEntries(
    Object.entries(entries).map(([key, entry]) => [
      key,
      {
        ...entry,
        fields: Object.fromEntries(
          Object.entries(entry.fields || {}).map(([fieldKey, value]) => [
            fieldKey,
            value
              .replace(/\{\\"([A-Za-z])\}/g, "$1")
              .replace(/"/g, "&quot;"),
          ]),
        ),
      },
    ]),
  );
}

type HtmlispChild = string | {
  type: string;
  attributes?: Record<string, string>;
  children?: HtmlispChild[];
};

function childrenToText(children: HtmlispChild[]) {
  return children.map((child) =>
    typeof child === "string" ? child : childrenToText(child.children || [])
  ).join("");
}

function escapeAttribute(value: string) {
  return value.replace(/"/g, "&quot;");
}

function parseBookIndex(text: string) {
  const ast = parseLatex(text, {
    blocks: environments,
    doubles,
    singles: {
      chapter: el("title"),
      label: el("label"),
      input: el("slug"),
    },
  });

  const titles = ast.filter((n) => n.type === "title").map((n) =>
    n.children[0]
  );
  const labels = ast.filter((n) => n.type === "label").map((n) =>
    n.children[0]
  );
  const slugs = ast.filter((n) => n.type === "slug").map((n) =>
    // @ts-expect-error This should be a string
    n.children[0].split("chapters/")[1].split("-").slice(1).join("-")
  );
  const paths = ast.filter((n) => n.type === "slug").map((n) => n.children[0]);

  return titles.map((title, i) => ({
    title: title as string,
    label: labels[i] as string,
    slug: slugs[i],
    path: `book/${paths[i]}.tex`,
  }));
}

export { init };
