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
  verbatim: {
    container: (children: string[]) => ({
      type: "pre",
      attributes: {},
      children,
    }),
    item: parseUntilEndEnvironment("verbatim"),
  },
  quote: {
    container: (children: string[]) => ({
      type: "blockquote",
      attributes: {},
      children,
    }),
    item: parseUntilEndEnvironment("quote"),
  },
  comment: {
    container: () => ({ type: "", attributes: {}, children: [] }),
    item: parseUntilEndEnvironment("comment"),
  },
  overbatim: {
    container: (children: string[]) => ({
      type: "pre",
      attributes: {},
      children,
    }),
    item: parseUntilEndEnvironment("overbatim"),
  },
  table: {
    container: (children: string[]) => parseTable(children.join("")),
    item: parseUntilEndEnvironment("table"),
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

function parseUntilEndEnvironment(environment: string) {
  return (getCharacter: {
    getIndex(): number;
    rest(): string;
    setIndex(value: number): void;
  }) => {
    const endMarker = `\\end{${environment}}`;
    const rest = getCharacter.rest();
    const endIndex = rest.indexOf(endMarker);

    if (endIndex <= 0) {
      throw new Error("No matching expression was found");
    }

    getCharacter.setIndex(getCharacter.getIndex() + endIndex);

    return rest.slice(0, endIndex);
  };
}

function parseTable(input: string) {
  const caption = input.match(/\\caption\{([^}]*)\}/)?.[1];
  const label = input.match(/\\label\{([^}]*)\}/)?.[1];
  const tabular = input.match(
    /\\begin\{tabular\}[^\n]*\n([\s\S]*?)\\end\{tabular\}/,
  )?.[1];

  if (!tabular) {
    return {
      type: "pre",
      attributes: {},
      children: [input],
    };
  }

  const rows = tabular
    .replace(/\\hline/g, "")
    .split(/\\\\/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => row.split("&").map((cell) => cell.trim()));
  const [headings = [], ...bodyRows] = rows;

  return {
    type: "figure",
    attributes: label ? { id: slugify(label) } : {},
    children: [
      {
        type: "table",
        attributes: {},
        children: [
          {
            type: "thead",
            attributes: {},
            children: [{
              type: "tr",
              attributes: {},
              children: headings.map((heading) => ({
                type: "th",
                attributes: {},
                children: [heading],
              })),
            }],
          },
          {
            type: "tbody",
            attributes: {},
            children: bodyRows.map((row) => ({
              type: "tr",
              attributes: {},
              children: row.map((cell) => ({
                type: "td",
                attributes: {},
                children: [cell],
              })),
            })),
          },
        ],
      },
      ...(caption
        ? [{
          type: "figcaption",
          attributes: {},
          children: [caption],
        }]
        : []),
    ],
  };
}

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

  async function indexBookSections(
    entries: { title: string; slug: string; path: string }[],
  ) {
    const sections = await Promise.all(
      entries.map(async (entry) => {
        const text = await load.textFile(entry.path);

        return parseSectionIndex(text).map((section) => ({
          ...section,
          path: entry.path,
          slug: `/book/${entry.slug}/#${section.slug}`,
        }));
      }),
    );

    return sections.flat();
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
    const refIndex = bookIndex.concat(await indexBookSections(bookIndex));
    const { previous, next } = getAdjacentEntries(bookIndex, path);

    // TODO: Pass book index here as well since that's needed for label linking
    // TODO: Add proper nesting to gustwind to allow loading any data from a parent
    // const { bibtex } = this.parentDataSources;
    const bibtex = await loadBibtex();

    const chapterText = await load.textFile(path);
    let footnotes = 0;
    const parser = {
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
        ...getRefs(refIndex),
      },
    };
    const ast = parseLatex(chapterText, parser);
    const tableOfContents = getTableOfContents(ast);

    const content = astToHTMLSync(ast, htmlispToHTMLSync);

    return {
      data: {
        title,
        author: {
          name: "Juho Vepsäläinen",
          twitter: "https://x.com/bebraw",
        },
      },
      tableOfContents,
      hasTableOfContents: tableOfContents.length > 0,
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
    autoref: (children: HtmlispChild[], matchCounts: Record<string, string[]>) => {
      const id = childrenToText(children) || matchCounts.autoref?.at(-1) || "";
      const ref = refEntries.find(({ label }) => label === id);

      if (ref) {
        return {
          type: "a",
          attributes: { href: ref.slug || "#" },
          children: [ref.title],
        };
      }

      return {
        type: "a",
        attributes: { href: `#${slugify(id)}` },
        children: [getAutorefLabel(id) || id],
      };
    },
    nameref: (children: HtmlispChild[]) => {
      const id = childrenToText(children);
      const ref = refEntries.find(({ label }) => label === id);

      return {
        type: "a",
        attributes: { href: ref?.slug || "#" },
        children: [ref?.title || id],
      };
    },
  };
}

function getAutorefLabel(id: string) {
  const [kind] = id.split(":");

  return kind || id;
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

function getTableOfContents(ast: HtmlispChild[]) {
  const foundIds: Record<string, number> = {};

  return ast.flatMap((node) => {
    if (typeof node === "string" || !["h2", "h3", "h4"].includes(node.type)) {
      return [];
    }

    const raw = childrenToText(node.children || []);
    const slug = getUniqueSlug(raw, foundIds);

    node.attributes = { ...node.attributes, id: slug };

    if (node.type === "h4") {
      return [];
    }

    return [{
      slug,
      level: Number(node.type.slice(1)),
      raw,
      text: raw,
    }];
  });
}

function getUniqueSlug(raw: string, foundIds: Record<string, number>) {
  let slug = slugify(raw);

  if (foundIds[slug]) {
    foundIds[slug]++;
    slug += `-${foundIds[slug]}`;
  } else {
    foundIds[slug] = 1;
  }

  return slug;
}

function childrenToText(children: HtmlispChild[]) {
  return children.map((child) =>
    typeof child === "string" ? child : childrenToText(child.children || [])
  ).join("");
}

function escapeAttribute(value: string) {
  return value.replace(/"/g, "&quot;");
}

function slugify(idBase: string) {
  return idBase
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\w]+/g, "-");
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

function parseSectionIndex(text: string) {
  const sections: { title: string; label: string; slug: string }[] = [];
  const foundIds: Record<string, number> = {};
  const ast = parseLatex(text, {
    blocks: environments,
    doubles,
    singles: {
      ...singles,
      section: el("h2"),
      subsection: el("h3"),
      subsubsection: el("h4"),
      label: el("label"),
    },
  });
  let pendingHeading:
    | { title: string; slug: string }
    | undefined;

  for (const node of ast) {
    if (typeof node === "string") {
      continue;
    }

    if (["h2", "h3", "h4"].includes(node.type)) {
      const title = childrenToText(node.children || []);

      pendingHeading = {
        title,
        slug: getUniqueSlug(title, foundIds),
      };

      continue;
    }

    if (node.type !== "label" || !pendingHeading) {
      continue;
    }

    const label = childrenToText(node.children || []);

    sections.push({
      title: pendingHeading.title,
      label,
      slug: pendingHeading.slug,
    });
    pendingHeading = undefined;
  }

  return sections;
}

export { init };
