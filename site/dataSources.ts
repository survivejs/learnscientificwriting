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
    const lines = await load.textFile(filename);

    return markdown(
      o?.skipFirstLine ? stripFirstMarkdownHeading(lines) : lines,
      filename,
    );
  }

  async function indexBook(
    chapterFile: string,
    appendixFile: string,
    o?: { flatten: boolean },
  ) {
    const chaptersText = await load.textFile(chapterFile);
    const appendicesText = await load.textFile(appendixFile);
    const chapters = numberBookEntries(
      parseBookIndex(chaptersText),
      (index) => String(index + 1),
    );
    const appendices = numberBookEntries(
      parseBookIndex(appendicesText),
      (index) => toAlphabeticIndex(index),
    );

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

        return parseSectionIndex(text, entry.number).map((section) => ({
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

    return parseBibtexCollection(bibtexText);
  }

  async function formatReferences() {
    const bibtex = await loadBibtex();
    const bookIndex = await indexBook(
      "./book/chapters.tex",
      "./book/appendices.tex",
      { flatten: true },
    );
    const usedCitationIds = await getUsedCitationIds(bookIndex);

    return Object.entries(bibtex)
      .filter(([key]) => usedCitationIds.has(key))
      .map(([key, entry]) => formatReference(key, entry))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }

  async function getUsedCitationIds(
    entries: { path: string }[],
  ) {
    const citations = await Promise.all(
      entries.map(async ({ path }) =>
        extractCitationIds(await load.textFile(path))
      ),
    );

    return new Set(citations.flat());
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
    const currentEntry = bookIndex.find((entry) => entry.path === path);
    const { previous, next } = getAdjacentEntries(bookIndex, path);

    // TODO: Pass book index here as well since that's needed for label linking
    // TODO: Add proper nesting to gustwind to allow loading any data from a parent
    // const { bibtex } = this.parentDataSources;
    const bibtex = await loadBibtex();

    const chapterText = normalizeLatexSource(await load.textFile(path));

    validateLatexReferences(path, chapterText, bibtex, refIndex);

    let footnotes = 0;
    const parser = {
      blocks: environments,
      doubles,
      // TODO: Connect refs here
      singles: {
        ...singles,
        ...cites(bibtex),
        ...getLinkedCites(bibtex),
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
    const tableOfContents = getTableOfContents(ast, currentEntry?.number);

    const content = astToHTMLSync(ast, htmlispToHTMLSync);

    return {
      data: {
        title: currentEntry?.title || title,
        description:
          "A chapter from The Process of Scientific Writing, an open guide to clear research articles.",
        author: {
          name: "Juho Vepsäläinen",
          site: "https://survivejs.com",
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

  return {
    indexBook,
    loadBibtex,
    formatReferences,
    processMarkdown,
    processChapter,
  };
}

function getLinkedCites(
  entries: Record<string, { fields?: Record<string, string> }>,
) {
  return {
    citep: (children: HtmlispChild[], matchCounts: Record<string, string[]>) => {
      const ids = getCitationIds(children, matchCounts.citep);

      return {
        type: "span",
        attributes: { title: escapeAttribute(getCitationTitle(ids, entries)) },
        children: ["("].concat(
          joinHtmlispChildren(
            ids.map((id) =>
              citationLink(id, entries[id], formatParentheticalCitation)
            ),
            "; ",
          ),
          [")"],
        ),
      };
    },
    citet: (children: HtmlispChild[], matchCounts: Record<string, string[]>) => {
      const ids = getCitationIds(children, matchCounts.citet);

      return {
        type: "span",
        attributes: { title: escapeAttribute(getCitationTitle(ids, entries)) },
        children: joinHtmlispChildren(
          ids.map((id) => citationLink(id, entries[id], formatTextualCitation)),
          ", ",
        ),
      };
    },
    fullcite: (
      children: HtmlispChild[],
      matchCounts: Record<string, string[]>,
    ) => {
      const ids = getCitationIds(children, matchCounts.fullcite);

      return {
        type: "span",
        attributes: { title: escapeAttribute(getCitationTitle(ids, entries)) },
        children: joinHtmlispChildren(
          ids.map((id) => citationLink(id, entries[id], formatFullCitation)),
          "; ",
        ),
      };
    },
  };
}

function getCitationIds(
  children: HtmlispChild[],
  matches?: string[],
) {
  return (childrenToText(children) || matches?.at(-1) || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function citationLink(
  id: string,
  entry: { fields?: Record<string, string> } | undefined,
  formatter: (id: string, entry?: { fields?: Record<string, string> }) => string,
) {
  return {
    type: "a",
    attributes: {
      href: `/book/references/#${escapeAttribute(id)}`,
      title: escapeAttribute(formatReferenceTitle(id, entry)),
    },
    children: [formatter(id, entry)],
  };
}

function formatParentheticalCitation(
  id: string,
  entry?: { fields?: Record<string, string> },
) {
  const fields = entry?.fields || {};
  const author = formatCitationAuthors(fields.author || id);
  const year = fields.year || "n.d.";

  return `${author}, ${year}`;
}

function formatTextualCitation(
  id: string,
  entry?: { fields?: Record<string, string> },
) {
  const fields = entry?.fields || {};
  const author = formatCitationAuthors(fields.author || id);
  const year = fields.year || "n.d.";

  return `${author} (${year})`;
}

function formatFullCitation(
  id: string,
  entry?: { fields?: Record<string, string> },
) {
  const reference = formatReference(id, entry || {});

  return [
    reference.authors,
    `(${reference.year}).`,
    `${reference.title}.`,
    reference.source,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatCitationAuthors(author: string) {
  const authors = splitAuthors(author).map((name) =>
    getAuthorSurname(name) || name
  );

  if (authors.length === 0) {
    return author;
  }

  if (authors.length === 1) {
    return authors[0];
  }

  if (authors.length === 2) {
    return `${authors[0]} & ${authors[1]}`;
  }

  return `${authors[0]} et al.`;
}

function getCitationTitle(
  ids: string[],
  entries: Record<string, { fields?: Record<string, string> }>,
) {
  return ids.map((id) => formatReferenceTitle(id, entries[id])).join("; ");
}

function formatReferenceTitle(
  id: string,
  entry?: { fields?: Record<string, string> },
) {
  const reference = formatReference(id, entry || {});

  return [reference.authors, `(${reference.year}).`, reference.title]
    .filter(Boolean)
    .join(" ");
}

function joinHtmlispChildren(
  children: HtmlispChild[],
  separator: string,
) {
  return children.flatMap((child, index) =>
    index === 0 ? [child] : [separator, child]
  );
}

function extractCitationIds(text: string) {
  const citations = stripLatexComments(text).matchAll(
    /\\(?:cite[A-Za-z]*|fullcite)(?:\s*\[[^\]]*\]){0,2}\s*\{([^}]*)\}/g,
  );

  return Array.from(citations).flatMap((match) =>
    match[1]
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

function validateLatexReferences(
  path: string,
  text: string,
  bibtex: Record<string, { fields?: Record<string, string> }>,
  refIndex: { label: string }[],
) {
  const citationIds = extractCitationIds(text);
  const labels = extractReferenceLabels(text);
  const availableLabels = new Set(
    refIndex.map(({ label }) => label).concat(extractDefinedLabels(text)),
  );
  const missingCitationIds = unique(
    citationIds.filter((id) => !bibtex[id]),
  );
  const missingLabels = unique(
    labels.filter((label) => !availableLabels.has(label)),
  );

  if (!missingCitationIds.length && !missingLabels.length) {
    return;
  }

  const details = [
    missingCitationIds.length
      ? `missing citations: ${missingCitationIds.join(", ")}`
      : "",
    missingLabels.length ? `missing refs: ${missingLabels.join(", ")}` : "",
  ].filter(Boolean);

  throw new Error(`${path}: ${details.join("; ")}`);
}

function extractReferenceLabels(text: string) {
  const references = stripLatexComments(text).matchAll(
    /\\(?:auto|name)?ref\s*\{([^}]*)\}/g,
  );

  return Array.from(references)
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function extractDefinedLabels(text: string) {
  const labels = stripLatexComments(text).matchAll(/\\label\s*\{([^}]*)\}/g);

  return Array.from(labels)
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function stripLatexComments(text: string) {
  return text
    .replace(/\\begin\{comment\}[\s\S]*?\\end\{comment\}/g, "")
    .split("\n")
    .map((line) => line.replace(/(?<!\\)%.*/, ""))
    .join("\n");
}

function normalizeLatexSource(text: string) {
  return text
    .replace(/^[ \t]*%(?:.*)(?:\r?\n|$)/gm, "")
    .replace(/\\-/g, "");
}

function stripFirstMarkdownHeading(text: string) {
  const [firstLine = "", ...rest] = text.split("\n");

  if (/^#{1,6}\s+\S/.test(firstLine.trim())) {
    return rest.join("\n");
  }

  return text;
}

function formatReference(
  id: string,
  entry: { fields?: Record<string, string> },
) {
  const fields = entry.fields || {};
  const authors = formatReferenceAuthors(fields.author || "");
  const year = fields.year || "n.d.";
  const title = cleanBibtexValue(fields.title || id);
  const source = formatReferenceSource(fields);
  const doi = cleanBibtexValue(fields.doi || "");
  const url = cleanBibtexUrl(fields.url || fields.howpublished || "");
  const citation = [authors, `(${year}).`, `${title}.`, source]
    .filter(Boolean)
    .join(" ");

  return {
    id,
    authors,
    year,
    title,
    source,
    citation,
    doi,
    doiUrl: doi ? `https://doi.org/${doi}` : "",
    url,
    sortKey: `${authors || id} ${year} ${title}`.toLowerCase(),
  };
}

function formatReferenceAuthors(author: string) {
  const authors = splitAuthors(author).map(formatReferenceAuthor).filter(Boolean);

  if (authors.length === 0) {
    return "Unknown author";
  }

  if (authors.length === 1) {
    return authors[0];
  }

  if (authors.length === 2) {
    return `${authors[0]} & ${authors[1]}`;
  }

  return `${authors.slice(0, -1).join(", ")}, & ${authors.at(-1)}`;
}

function formatReferenceAuthor(author: string) {
  const clean = cleanBibtexValue(author);

  if (!clean) {
    return "";
  }

  if (clean.includes(",")) {
    const [last, given = ""] = clean.split(",").map((part) => part.trim());

    return [last, formatInitials(given)].filter(Boolean).join(", ");
  }

  const parts = clean.split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return clean;
  }

  const last = parts.at(-1) || "";

  return [last, formatInitials(parts.slice(0, -1).join(" "))]
    .filter(Boolean)
    .join(", ");
}

function getAuthorSurname(author: string) {
  const clean = cleanBibtexValue(author);

  if (clean.includes(",")) {
    return clean.split(",")[0].trim();
  }

  return clean.split(/\s+/).filter(Boolean).at(-1) || clean;
}

function splitAuthors(author: string) {
  return cleanBibtexValue(author)
    .split(/\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatInitials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `${part[0]}.`)
    .join(" ");
}

function formatReferenceSource(fields: Record<string, string>) {
  return [
    fields.journal,
    fields.booktitle,
    fields.publisher,
    fields.organization,
    fields.school,
    fields.volume ? `vol. ${fields.volume}` : "",
    fields.number ? `no. ${fields.number}` : "",
    fields.pages ? `pp. ${fields.pages.replace(/--/g, "-")}` : "",
  ]
    .map(cleanBibtexValue)
    .filter(Boolean)
    .join(", ");
}

function cleanBibtexUrl(value: string) {
  return cleanBibtexValue(value).replace(/^\\url\{(.+)\}$/, "$1");
}

function cleanBibtexValue(value?: string) {
  return (value || "")
    .replace(/\{\\"([A-Za-z])\}/g, (_, letter: string) =>
      decodeLatexAccent('"', letter)
    )
    .replace(/\\"([A-Za-z])/g, (_, letter: string) =>
      decodeLatexAccent('"', letter)
    )
    .replace(/\{\\'([A-Za-z])\}/g, (_, letter: string) =>
      decodeLatexAccent("'", letter)
    )
    .replace(/\\'([A-Za-z])/g, (_, letter: string) =>
      decodeLatexAccent("'", letter)
    )
    .replace(/\{\\`([A-Za-z])\}/g, (_, letter: string) =>
      decodeLatexAccent("`", letter)
    )
    .replace(/\\`([A-Za-z])/g, (_, letter: string) =>
      decodeLatexAccent("`", letter)
    )
    .replace(/\{\\\^([A-Za-z])\}/g, (_, letter: string) =>
      decodeLatexAccent("^", letter)
    )
    .replace(/\\\^([A-Za-z])/g, (_, letter: string) =>
      decodeLatexAccent("^", letter)
    )
    .replace(/\{\\~([A-Za-z])\}/g, (_, letter: string) =>
      decodeLatexAccent("~", letter)
    )
    .replace(/\\~([A-Za-z])/g, (_, letter: string) =>
      decodeLatexAccent("~", letter)
    )
    .replace(/\{\\c\{([A-Za-z])\}\}/g, (_, letter: string) =>
      decodeLatexAccent("c", letter)
    )
    .replace(/\\c\{([A-Za-z])\}/g, (_, letter: string) =>
      decodeLatexAccent("c", letter)
    )
    .replace(/\{\\"([A-Za-z])\}/g, "$1")
    .replace(/\{\\[A-Za-z]+\{([^{}]+)\}\}/g, "$1")
    .replace(/\\[A-Za-z]+\{([^{}]+)\}/g, "$1")
    .replace(/\\LaTeX\\?/g, "LaTeX")
    .replace(/\\texttt\{([^}]*)\}/g, "$1")
    .replace(/\\url\{([^}]*)\}/g, "$1")
    .replace(/\\&/g, "&")
    .replace(/[{}]/g, "")
    .trim();
}

function decodeLatexAccent(accent: string, letter: string) {
  const accents: Record<string, Record<string, string>> = {
    '"': {
      A: "Ä",
      E: "Ë",
      I: "Ï",
      O: "Ö",
      U: "Ü",
      Y: "Ÿ",
      a: "ä",
      e: "ë",
      i: "ï",
      o: "ö",
      u: "ü",
      y: "ÿ",
    },
    "'": {
      A: "Á",
      E: "É",
      I: "Í",
      O: "Ó",
      U: "Ú",
      Y: "Ý",
      a: "á",
      e: "é",
      i: "í",
      o: "ó",
      u: "ú",
      y: "ý",
    },
    "`": {
      A: "À",
      E: "È",
      I: "Ì",
      O: "Ò",
      U: "Ù",
      a: "à",
      e: "è",
      i: "ì",
      o: "ò",
      u: "ù",
    },
    "^": {
      A: "Â",
      E: "Ê",
      I: "Î",
      O: "Ô",
      U: "Û",
      a: "â",
      e: "ê",
      i: "î",
      o: "ô",
      u: "û",
    },
    "~": {
      A: "Ã",
      N: "Ñ",
      O: "Õ",
      a: "ã",
      n: "ñ",
      o: "õ",
    },
    c: {
      C: "Ç",
      c: "ç",
    },
  };

  return accents[accent]?.[letter] || letter;
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

type HtmlispChild = string | {
  type: string;
  attributes?: Record<string, string>;
  children?: HtmlispChild[];
};

function getTableOfContents(ast: HtmlispChild[], chapterNumber?: string) {
  const foundIds: Record<string, number> = {};
  const headingNumbers = { h2: 0, h3: 0, h4: 0 };

  return ast.flatMap((node) => {
    if (typeof node === "string" || !["h2", "h3", "h4"].includes(node.type)) {
      return [];
    }

    const raw = childrenToText(node.children || []);
    const slug = getUniqueSlug(raw, foundIds);
    const number = getHeadingNumber(node.type, headingNumbers, chapterNumber);
    const text = [number, raw].filter(Boolean).join(" ");

    node.attributes = { ...node.attributes, id: slug };
    node.children = number
      ? [
        {
          type: "span",
          attributes: { class: "text-muted" },
          children: [`${number} `],
        },
        ...(node.children || []),
      ]
      : node.children;

    if (node.type === "h4") {
      return [];
    }

    return [{
      slug,
      level: Number(node.type.slice(1)),
      raw: text,
      text,
    }];
  });
}

function getHeadingNumber(
  type: string,
  headingNumbers: { h2: number; h3: number; h4: number },
  chapterNumber?: string,
) {
  if (type === "h2") {
    headingNumbers.h2++;
    headingNumbers.h3 = 0;
    headingNumbers.h4 = 0;

    return [chapterNumber, headingNumbers.h2].filter(Boolean).join(".");
  }

  if (type === "h3") {
    headingNumbers.h3++;
    headingNumbers.h4 = 0;

    return [chapterNumber, headingNumbers.h2, headingNumbers.h3]
      .filter((part) => part !== undefined && part !== "")
      .join(".");
  }

  headingNumbers.h4++;

  return [chapterNumber, headingNumbers.h2, headingNumbers.h3, headingNumbers.h4]
    .filter((part) => part !== undefined && part !== "")
    .join(".");
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

function numberBookEntries(
  entries: {
    title: string;
    label: string;
    slug: string;
    path: string;
  }[],
  getNumber: (index: number) => string,
) {
  return entries.map((entry, index) => {
    const number = getNumber(index);

    return {
      ...entry,
      number,
      unnumberedTitle: entry.title,
      title: `${number}. ${entry.title}`,
    };
  });
}

function toAlphabeticIndex(index: number) {
  let number = index + 1;
  let result = "";

  while (number > 0) {
    number--;
    result = String.fromCharCode(65 + (number % 26)) + result;
    number = Math.floor(number / 26);
  }

  return result;
}

function parseBookIndex(text: string) {
  const ast = parseLatex(normalizeLatexSource(text), {
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

type SectionIndexEntry = { title: string; label: string; slug: string };

function parseSectionIndex(text: string, chapterNumber?: string) {
  const ast = parseLatex(normalizeLatexSource(text), {
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

  return collectLabeledSections(ast, chapterNumber);
}

function collectLabeledSections(
  ast: HtmlispChild[],
  chapterNumber?: string,
) {
  const sections: SectionIndexEntry[] = [];
  const foundIds: Record<string, number> = {};
  const headingNumbers = { h2: 0, h3: 0, h4: 0 };
  let pendingHeading:
    | { title: string; slug: string }
    | undefined;

  for (const node of ast) {
    if (typeof node === "string") {
      continue;
    }

    if (["h2", "h3", "h4"].includes(node.type)) {
      const title = childrenToText(node.children || []);
      const number = getHeadingNumber(node.type, headingNumbers, chapterNumber);

      pendingHeading = {
        title: [number, title].filter(Boolean).join(" "),
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
