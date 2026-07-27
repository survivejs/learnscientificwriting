import type { Element, Root, RootContent } from "hast";
import {
  headingNumbersByOffset,
  renderTree,
  slugify,
  toHtml,
} from "scholarmark";
import type {
  CitationFormatContext,
  CitationFormatter,
  PublicationCitationEntry,
  ReferenceTarget,
} from "scholarmark";

type TableOfContentsEntry = {
  slug: string;
  level: number;
  raw: string;
  text: string;
};

type SectionEntry = {
  title: string;
  label: string;
  slug: string;
};

type TransformBookMarkdownOptions = {
  bibliographySource?: string;
  chapterNumber?: string;
  referenceTargets?: ReadonlyMap<string, ReferenceTarget>;
  sourcePath?: string;
  validateReferences?: boolean;
};

const headingAnchorClass =
  "ml-2 inline-block font-sans text-[0.75em] font-normal no-underline text-muted/70 opacity-70 transition-opacity hover:text-slate-950 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 dark:text-[#8fb9b9] dark:hover:text-[#f7ead0] print:hidden";

async function transformBookMarkdown(
  source: string,
  {
    bibliographySource = "",
    chapterNumber,
    referenceTargets = new Map(),
    sourcePath = "<book-markdown>",
    validateReferences = true,
  }: TransformBookMarkdownOptions = {},
) {
  const citationTitles = new Map<string, string>();
  const citationFormatter = createCitationFormatter(citationTitles);
  const headingNumbers = prefixHeadingNumbers(source, chapterNumber);
  const result = await renderTree(source, bibliographySource, "apa", {
    citationFormatter,
    headingNumbers,
    referenceTargets,
  });
  const diagnostics = result.diagnostics.filter((diagnostic) =>
    validateReferences || !diagnostic.message.startsWith("Missing label:")
  );

  if (diagnostics.some(({ severity }) => severity === "error")) {
    throw new Error(
      diagnostics.map(({ message, from, to }) =>
        `${sourcePath}:${from}-${to}: ${message}`
      ).join("\n"),
    );
  }

  const sections = attachReferenceTargets(result.tree, result.references);
  const citationIds = new Set<string>();
  const headingsById = new Map(
    result.headings.map((heading) => [heading.id, heading]),
  );

  visitElements(result.tree, (element) => {
    delete element.properties.dataSourceFrom;
    delete element.properties.dataSourceTo;

    if (element.tagName === "h2" || element.tagName === "h3") {
      if (element.properties.id === "footnote-label") {
        element.children = element.children.filter((child) =>
          !isElementWithClass(child, "section-number")
        );
        return;
      }

      const id = typeof element.properties.id === "string"
        ? element.properties.id
        : "";
      const heading = headingsById.get(id);

      element.properties.className = ["group", "scroll-mt-24"];

      const number = element.children.find((child) =>
        isElementWithClass(child, "section-number")
      );

      if (number?.type === "element") {
        number.properties.className = ["text-muted"];
      }

      element.children.push({
        type: "element",
        tagName: "a",
        properties: {
          href: `#${id}`,
          className: headingAnchorClass.split(" "),
          ariaLabel: `Link to ${heading?.title || id}`,
          title: "Link to this section",
        },
        children: [{ type: "text", value: "#" }],
      });
    }

    if (element.tagName === "button" &&
      hasClass(element, "semantic-citation")) {
      const id = typeof element.properties.dataCitation === "string"
        ? element.properties.dataCitation
        : "";

      if (id) {
        citationIds.add(id);
      }

      element.tagName = "a";
      element.properties = {
        href: `/book/references/#${id}`,
        title: citationTitles.get(id),
        className: ["semantic-citation", "underline"],
        dataCitation: id,
      };
    } else if (element.tagName === "a" &&
      !hasClass(element, "no-underline")) {
      addClass(element, "underline");
    }
  });

  const tableOfContents: TableOfContentsEntry[] = result.headings.map(
    ({ depth, id, number, title }) => {
      const text = [number, title].filter(Boolean).join(" ");

      return { slug: id, level: depth, raw: text, text };
    },
  );

  return {
    citationIds: Array.from(citationIds),
    content: toHtml(result.tree),
    sections,
    tableOfContents,
  };
}

function prefixHeadingNumbers(source: string, chapterNumber?: string) {
  const generated = headingNumbersByOffset(source);

  if (!chapterNumber) {
    return generated;
  }

  return Object.fromEntries(
    Object.entries(generated).map(([offset, number]) => [
      offset,
      `${chapterNumber}.${number}`,
    ]),
  );
}

function attachReferenceTargets(
  tree: Root,
  references: readonly {
    label: string;
    title: string;
  }[],
): SectionEntry[] {
  const referencesByLabel = new Map(
    references.map((reference) => [reference.label, reference]),
  );
  const sections: SectionEntry[] = [];
  const children = tree.children;

  for (let index = 0; index < children.length; index++) {
    const child = children[index];

    if (child.type !== "element" ||
      !hasClass(child, "semantic-label") ||
      typeof child.properties.id !== "string") {
      continue;
    }

    const label = child.properties.id;
    const target = previousElement(children, index);
    const reference = referencesByLabel.get(label);

    if (!target || !reference) {
      continue;
    }

    const targetId = typeof target.properties.id === "string"
      ? target.properties.id
      : slugify(label);

    target.properties.id = targetId;
    sections.push({
      label,
      slug: targetId,
      title: reference.title,
    });
  }

  tree.children = children.filter((child) =>
    child.type !== "element" || !hasClass(child, "semantic-label")
  );

  return sections;
}

function previousElement(children: RootContent[], from: number) {
  for (let index = from - 1; index >= 0; index--) {
    const child = children[index];

    if (child?.type === "element") {
      return child;
    }
  }

  return undefined;
}

function createCitationFormatter(
  citationTitles: Map<string, string>,
): CitationFormatter {
  return {
    formatCitation(entry, context) {
      citationTitles.set(entry.id, formatReferenceTitle(entry));
      return formatCitation(entry, context);
    },
    formatBibliography(entry) {
      return formatFullCitation(entry);
    },
  };
}

function formatCitation(
  entry: PublicationCitationEntry,
  { mode }: CitationFormatContext,
) {
  if (mode === "textual") {
    return `${formatCitationAuthors(entry)} (${entry.year || "n.d."})`;
  }
  if (mode === "full") {
    return formatFullCitation(entry);
  }

  return `${formatCitationAuthors(entry)}, ${entry.year || "n.d."}`;
}

function formatCitationAuthors(entry: PublicationCitationEntry) {
  const authors = entry.authors.map((author) =>
    author.family || author.literal || author.given || ""
  ).filter(Boolean);

  if (authors.length <= 1) {
    return authors[0] || entry.id;
  }
  if (authors.length === 2) {
    return `${authors[0]} & ${authors[1]}`;
  }

  return `${authors[0]} et al.`;
}

function formatReferenceAuthors(entry: PublicationCitationEntry) {
  const authors = entry.authors.map((author) => {
    if (author.literal) {
      return author.literal;
    }

    const initials = (author.given || "").split(/\s+/).filter(Boolean)
      .map((part) => `${part[0]}.`).join(" ");

    return [author.family, initials].filter(Boolean).join(", ");
  }).filter(Boolean);

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

function formatFullCitation(entry: PublicationCitationEntry) {
  const source = formatReferenceSource(entry.data);

  return [
    formatReferenceAuthors(entry),
    `(${entry.year || "n.d."}).`,
    `${entry.title || entry.id}.`,
    source,
  ].filter(Boolean).join(" ");
}

function formatReferenceTitle(entry: PublicationCitationEntry) {
  return [
    formatReferenceAuthors(entry),
    `(${entry.year || "n.d."}).`,
    entry.title || entry.id,
  ].filter(Boolean).join(" ");
}

function formatReferenceSource(fields: Record<string, unknown>) {
  const text = (key: string) =>
    typeof fields[key] === "string" ? fields[key] : "";

  return [
    text("container-title"),
    text("publisher"),
    text("publisher-place"),
    text("volume") ? `vol. ${text("volume")}` : "",
    text("issue") ? `no. ${text("issue")}` : "",
    text("page") ? `pp. ${text("page").replace(/--/g, "-")}` : "",
  ].filter(Boolean).join(", ");
}

function visitElements(
  node: Root | Element,
  visitor: (element: Element) => void,
) {
  for (const child of node.children) {
    if (child.type !== "element") {
      continue;
    }

    visitor(child);
    visitElements(child, visitor);
  }
}

function hasClass(element: Element, className: string) {
  const classes = element.properties.className;

  return Array.isArray(classes)
    ? classes.map(String).includes(className)
    : typeof classes === "string" && classes.split(/\s+/).includes(className);
}

function addClass(element: Element, className: string) {
  const classes = Array.isArray(element.properties.className)
    ? element.properties.className.map(String)
    : typeof element.properties.className === "string"
    ? element.properties.className.split(/\s+/)
    : [];

  element.properties.className = Array.from(new Set(classes.concat(className)));
}

function isElementWithClass(
  node: RootContent,
  className: string,
): node is Element {
  return node.type === "element" && hasClass(node, className);
}

export type { SectionEntry, TransformBookMarkdownOptions };
export default transformBookMarkdown;
