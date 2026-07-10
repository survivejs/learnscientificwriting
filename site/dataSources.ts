import { parseBibtexCollection } from "gustwind/htmlisp";
import type { DataSourcesApi } from "gustwind";
import transformBookMarkdown from "./transforms/bookMarkdown.ts";
import type {
  Citation as MarkdownCitation,
  Reference as MarkdownReference,
} from "./transforms/bookMarkdown.ts";
import getMarkdown from "./transforms/markdown.ts";

type BookSourceEntry = {
  title: string;
  label: string;
  slug: string;
  path: string;
  order: number;
  kind: "chapter" | "appendix";
};

type BookEntry = BookSourceEntry & {
  number: string;
  unnumberedTitle: string;
};

type BookIndex = {
  chapters: BookEntry[];
  appendices: BookEntry[];
};

type BookIndexSource = {
  chapters: BookSourceEntry[];
  appendices: BookSourceEntry[];
};

type BibtexEntries = Record<string, { fields?: Record<string, string> }>;

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

  async function indexBook(o?: { flatten: boolean }) {
    const source = await load.json<BookIndexSource>({
      path: "content/book/index.json",
      type: "book-index",
    });
    const chapters = numberBookEntries(
      source.chapters,
      (index) => String(index + 1),
    );
    const appendices = numberBookEntries(
      source.appendices,
      toAlphabeticIndex,
    );

    if (o?.flatten) {
      return chapters.concat(appendices);
    }

    return { chapters, appendices };
  }

  async function indexBookSections(
    entries: { title: string; slug: string; path: string; number: string }[],
  ) {
    const sections = await Promise.all(
      entries.map(async (entry) => {
        const text = await load.textFile(entry.path);
        const result = await transformBookMarkdown(text, {
          chapterNumber: entry.number,
          sourcePath: entry.path,
        });

        return result.sections.map((section) => ({
          ...section,
          path: entry.path,
          slug: `/book/${entry.slug}/#${section.slug}`,
        }));
      }),
    );

    return sections.flat();
  }

  async function loadBibtex() {
    const bibtexText = await load.textFile("content/book/bibliography.bib");

    return parseBibtexCollection(bibtexText);
  }

  async function formatReferences() {
    const bibtex = await loadBibtex();
    const bookIndex = await indexBook({ flatten: true });
    const usedCitationIds = await getUsedCitationIds(bookIndex);

    return Object.entries(bibtex)
      .filter(([key]) => usedCitationIds.has(key))
      .map(([key, entry]) => formatReference(key, entry))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }

  async function getUsedCitationIds(entries: { path: string }[]) {
    const citations = await Promise.all(
      entries.map(async ({ path }) =>
        (await transformBookMarkdown(await load.textFile(path), {
          sourcePath: path,
        })).citationIds
      ),
    );

    return new Set(citations.flat());
  }

  async function processChapter(
    this: {
      parentDataSources?: {
        bookIndex?: BookIndex | BookEntry[];
        bibtex?: BibtexEntries;
      };
    },
    { path, title }: { path: string; title: string },
  ) {
    const inheritedBookIndex = this?.parentDataSources?.bookIndex;
    const bookIndex = Array.isArray(inheritedBookIndex)
      ? inheritedBookIndex
      : inheritedBookIndex
      ? flattenBookIndex(inheritedBookIndex)
      : await indexBook({ flatten: true });
    const refIndex = bookIndex.concat(await indexBookSections(bookIndex));
    const currentEntry = bookIndex.find((entry) => entry.path === path);
    const { previous, next } = getAdjacentEntries(bookIndex, path);
    const bibtex = this?.parentDataSources?.bibtex || await loadBibtex();

    assertUniqueReferenceLabels(refIndex);

    const result = await transformBookMarkdown(await load.textFile(path), {
      chapterNumber: currentEntry?.number,
      sourcePath: path,
      renderCitation: (citation) =>
        renderMarkdownCitation(path, citation, bibtex),
      renderReference: (reference) =>
        renderMarkdownReference(path, reference, refIndex),
    });

    return {
      data: {
        title: currentEntry?.title || title,
        description:
          "A chapter from The Process of Scientific Writing, an open guide to clear research articles.",
        ogDescription: "An open guide to clear research articles.",
        ogEyebrow: /^[A-Z]\.\s/.test(currentEntry?.title || title)
          ? "APPENDIX"
          : "THE PROCESS OF SCIENTIFIC WRITING",
        author: {
          name: "Juho Vepsäläinen",
          site: "https://survivejs.com",
          twitter: "https://x.com/bebraw",
        },
      },
      tableOfContents: result.tableOfContents,
      hasTableOfContents: result.tableOfContents.length > 0,
      bookContents: getSidebarBookContents(bookIndex),
      content: result.content,
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

function renderMarkdownCitation(
  path: string,
  citation: MarkdownCitation,
  entries: BibtexEntries,
) {
  const missingIds = citation.ids.filter((id) => !entries[id]);

  if (missingIds.length) {
    throw new Error(`${path}: missing citations: ${missingIds.join(", ")}`);
  }

  const formatter = citation.mode === "textual"
    ? formatTextualCitation
    : citation.mode === "full"
    ? formatFullCitation
    : formatParentheticalCitation;
  const separator = citation.mode === "textual" ? ", " : "; ";
  const rendered = citation.ids.map((id) => {
    const entry = entries[id];

    return `<a href="/book/references/#${escapeAttribute(id)}" title="${
      escapeAttribute(formatReferenceTitle(id, entry))
    }">${escapeHtml(formatter(id, entry))}</a>`;
  }).join(separator);
  const located = citation.locator
    ? `${rendered}, ${escapeHtml(citation.locator)}`
    : rendered;
  const body = citation.mode === "parenthetical"
    ? `(${located})`
    : located;

  return [
    citation.prefix ? escapeHtml(citation.prefix) : "",
    body,
    citation.suffix ? escapeHtml(citation.suffix) : "",
  ].join("");
}

function renderMarkdownReference(
  path: string,
  reference: MarkdownReference,
  entries: { title: string; label: string; slug: string }[],
) {
  const entry = entries.find(({ label }) => label === reference.id);

  if (!entry) {
    throw new Error(`${path}: missing refs: ${reference.id}`);
  }

  const href = entry.slug.startsWith("/") || entry.slug.startsWith("#")
    ? entry.slug
    : `/book/${entry.slug}/`;

  return `<a href="${escapeAttribute(href)}">${
    escapeHtml(reference.text || entry.title)
  }</a>`;
}

function assertUniqueReferenceLabels(entries: { label: string }[]) {
  const labels = new Set<string>();

  for (const { label } of entries) {
    if (labels.has(label)) {
      throw new Error(`Duplicate book reference label: ${label}`);
    }

    labels.add(label);
  }
}

function formatParentheticalCitation(
  id: string,
  entry?: { fields?: Record<string, string> },
) {
  const fields = entry?.fields || {};

  return `${formatCitationAuthors(fields.author || id)}, ${
    fields.year || "n.d."
  }`;
}

function formatTextualCitation(
  id: string,
  entry?: { fields?: Record<string, string> },
) {
  const fields = entry?.fields || {};

  return `${formatCitationAuthors(fields.author || id)} (${
    fields.year || "n.d."
  })`;
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
  ].filter(Boolean).join(" ");
}

function formatCitationAuthors(author: string) {
  const authors = splitAuthors(author).map((name) =>
    getAuthorSurname(name) || name
  );

  if (authors.length <= 1) {
    return authors[0] || author;
  }
  if (authors.length === 2) {
    return `${authors[0]} & ${authors[1]}`;
  }

  return `${authors[0]} et al.`;
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

  return [parts.at(-1), formatInitials(parts.slice(0, -1).join(" "))]
    .filter(Boolean)
    .join(", ");
}

function getAuthorSurname(author: string) {
  const clean = cleanBibtexValue(author);

  return clean.includes(",")
    ? clean.split(",")[0].trim()
    : clean.split(/\s+/).filter(Boolean).at(-1) || clean;
}

function splitAuthors(author: string) {
  return cleanBibtexValue(author)
    .split(/\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatInitials(value: string) {
  return value.split(/\s+/)
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
  ].map(cleanBibtexValue).filter(Boolean).join(", ");
}

function cleanBibtexUrl(value: string) {
  return cleanBibtexValue(value).replace(/^\\url\{(.+)\}$/, "$1");
}

function cleanBibtexValue(value?: string) {
  return (value || "")
    .replace(/\{\\"([A-Za-z])\}/g, (_, letter: string) =>
      decodeBibtexAccent('"', letter)
    )
    .replace(/\\"([A-Za-z])/g, (_, letter: string) =>
      decodeBibtexAccent('"', letter)
    )
    .replace(/\{\\'([A-Za-z])\}/g, (_, letter: string) =>
      decodeBibtexAccent("'", letter)
    )
    .replace(/\\'([A-Za-z])/g, (_, letter: string) =>
      decodeBibtexAccent("'", letter)
    )
    .replace(/\{\\`([A-Za-z])\}/g, (_, letter: string) =>
      decodeBibtexAccent("`", letter)
    )
    .replace(/\\`([A-Za-z])/g, (_, letter: string) =>
      decodeBibtexAccent("`", letter)
    )
    .replace(/\{\\\^([A-Za-z])\}/g, (_, letter: string) =>
      decodeBibtexAccent("^", letter)
    )
    .replace(/\\\^([A-Za-z])/g, (_, letter: string) =>
      decodeBibtexAccent("^", letter)
    )
    .replace(/\{\\~([A-Za-z])\}/g, (_, letter: string) =>
      decodeBibtexAccent("~", letter)
    )
    .replace(/\\~([A-Za-z])/g, (_, letter: string) =>
      decodeBibtexAccent("~", letter)
    )
    .replace(/\{\\c\{([A-Za-z])\}\}/g, (_, letter: string) =>
      decodeBibtexAccent("c", letter)
    )
    .replace(/\\c\{([A-Za-z])\}/g, (_, letter: string) =>
      decodeBibtexAccent("c", letter)
    )
    .replace(/\{\\[A-Za-z]+\{([^{}]+)\}\}/g, "$1")
    .replace(/\\[A-Za-z]+\{([^{}]+)\}/g, "$1")
    .replace(/\\LaTeX\\?/g, "LaTeX")
    .replace(/\\texttt\{([^}]*)\}/g, "$1")
    .replace(/\\url\{([^}]*)\}/g, "$1")
    .replace(/\\&/g, "&")
    .replace(/[{}]/g, "")
    .trim();
}

function decodeBibtexAccent(accent: string, letter: string) {
  const accents: Record<string, Record<string, string>> = {
    '"': {
      A: "Ä", E: "Ë", I: "Ï", O: "Ö", U: "Ü", Y: "Ÿ",
      a: "ä", e: "ë", i: "ï", o: "ö", u: "ü", y: "ÿ",
    },
    "'": {
      A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú", Y: "Ý",
      a: "á", e: "é", i: "í", o: "ó", u: "ú", y: "ý",
    },
    "`": {
      A: "À", E: "È", I: "Ì", O: "Ò", U: "Ù",
      a: "à", e: "è", i: "ì", o: "ò", u: "ù",
    },
    "^": {
      A: "Â", E: "Ê", I: "Î", O: "Ô", U: "Û",
      a: "â", e: "ê", i: "î", o: "ô", u: "û",
    },
    "~": { A: "Ã", N: "Ñ", O: "Õ", a: "ã", n: "ñ", o: "õ" },
    c: { C: "Ç", c: "ç" },
  };

  return accents[accent]?.[letter] || letter;
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

function formatAdjacentEntry(entry?: { title: string; slug: string }) {
  return entry
    ? { data: { title: entry.title, slug: `/book/${entry.slug}/` } }
    : undefined;
}

function getSidebarBookContents(
  entries: { number: string; unnumberedTitle: string; slug: string }[],
) {
  const formatEntry = (
    entry: { number: string; unnumberedTitle: string; slug: string },
  ) => ({
    number: entry.number,
    title: entry.unnumberedTitle,
    href: `/book/${entry.slug}/`,
  });

  return {
    chapters: entries.filter((entry) => /^\d+$/.test(entry.number)).map(
      formatEntry,
    ),
    appendices: entries.filter((entry) => /^[A-Z]+$/.test(entry.number)).map(
      formatEntry,
    ),
  };
}

function flattenBookIndex(bookIndex: BookIndex) {
  return bookIndex.chapters.concat(bookIndex.appendices);
}

function numberBookEntries(
  entries: BookSourceEntry[],
  getNumber: (index: number) => string,
) {
  return entries
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((entry, index) => {
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

function stripFirstMarkdownHeading(text: string) {
  const [firstLine = "", ...rest] = text.split("\n");

  return /^#{1,6}\s+\S/.test(firstLine.trim()) ? rest.join("\n") : text;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}

export { init };
