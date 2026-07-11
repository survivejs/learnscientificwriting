import {
  defineHastPlugin,
  defineMdastPlugin,
  markdownToHtml,
} from "satteri";

type CitationMode = "parenthetical" | "textual" | "full";

type Citation = {
  ids: string[];
  mode: CitationMode;
  locator?: string;
  prefix?: string;
  suffix?: string;
};

type Reference = {
  id: string;
  text?: string;
};

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
  chapterNumber?: string;
  sourcePath?: string;
  renderCitation?: (citation: Citation) => string;
  renderReference?: (reference: Reference) => string;
};

async function transformBookMarkdown(
  source: string,
  {
    chapterNumber,
    sourcePath = "<book-markdown>",
    renderCitation = () => "",
    renderReference = () => "",
  }: TransformBookMarkdownOptions = {},
) {
  const tableOfContents: TableOfContentsEntry[] = [];
  const sections: SectionEntry[] = [];
  const aliasSections: SectionEntry[] = [];
  const matchedAliases = new Set<SectionEntry>();
  const citationIds = new Set<string>();
  const foundIds: Record<string, number> = {};
  const headingNumbers = { h2: 0, h3: 0, h4: 0 };

  const semantics = defineMdastPlugin({
    name: "book-semantics",
    textDirective(node, context) {
      const value = context.textContent(node).trim();

      if (node.name === "cite") {
        const ids = value.split(",").map((id) => id.trim()).filter(Boolean);

        if (!ids.length) {
          throw new Error(`${sourcePath}: citation requires at least one id`);
        }

        const mode = node.attributes?.mode || "parenthetical";

        if (!isCitationMode(mode)) {
          throw new Error(`${sourcePath}: unsupported citation mode "${mode}"`);
        }

        ids.forEach((id) => citationIds.add(id));

        return {
          type: "html",
          value: renderCitation({
            ids,
            mode,
            locator: attributeValue(node.attributes?.locator),
            prefix: attributeValue(node.attributes?.prefix),
            suffix: attributeValue(node.attributes?.suffix),
          }),
        };
      }

      if (node.name === "ref") {
        const target = attributeValue(node.attributes?.target) || value;

        if (!target) {
          throw new Error(`${sourcePath}: reference requires an id`);
        }

        return {
          type: "html",
          value: renderReference({
            id: target,
            text: attributeValue(node.attributes?.text) ||
              (node.attributes?.target ? value || undefined : undefined),
          }),
        };
      }

      throw new Error(
        `${sourcePath}: unsupported text directive ":${node.name}"`,
      );
    },
    leafDirective(node, context) {
      if (!["alias", "anchor"].includes(node.name)) {
        throw new Error(
          `${sourcePath}: unsupported leaf directive "::${node.name}"`,
        );
      }

      const title = context.textContent(node).trim();
      const target = attributeValue(node.attributes?.target);

      if (!target || !title) {
        throw new Error(
          `${sourcePath}: anchor requires a title and target`,
        );
      }

      const slug = attributeValue(node.attributes?.slug) || slugify(target);

      const section = { label: target, slug, title };

      sections.push(section);

      if (node.name === "alias") {
        aliasSections.push(section);
      }

      return {
        type: "html",
        value: node.name === "anchor"
          ? `<span id="${escapeAttribute(slug)}"></span>`
          : "",
      };
    },
    containerDirective(node) {
      throw new Error(
        `${sourcePath}: unsupported container directive ":::${node.name}"`,
      );
    },
  });

  const structure = defineHastPlugin({
    name: "book-structure",
    element: [
      {
        filter: ["h2", "h3", "h4"],
        visit(node, context) {
          const raw = context.textContent(node);

          if (node.tagName === "h4") {
            context.replaceNode(node, {
              type: "element",
              tagName: "b",
              properties: {},
              children: node.children,
            });
            return;
          }

          const explicitId = typeof node.properties?.id === "string"
            ? node.properties.id
            : undefined;

          if (explicitId === "footnote-label") {
            return;
          }

          const slug = explicitId || getUniqueSlug(raw, foundIds);
          const number = getHeadingNumber(
            node.tagName,
            headingNumbers,
            chapterNumber,
          );
          const text = [number, raw].filter(Boolean).join(" ");
          const matchingAliases = aliasSections.filter((section) =>
            section.slug === slug
          );

          for (const matchingAlias of matchingAliases) {
            matchingAlias.title = text;
            matchedAliases.add(matchingAlias);
          }

          context.setProperty(node, "id", slug);
          context.setProperty(
            node,
            "class",
            "group scroll-mt-24",
          );

          if (number) {
            context.prependChild(node, {
              type: "element",
              tagName: "span",
              properties: { class: "text-muted" },
              children: [{ type: "text", value: `${number} ` }],
            });
          }

          context.appendChild(node, {
            type: "element",
            tagName: "a",
            properties: {
              href: `#${slug}`,
              class:
                "ml-2 inline-block font-sans text-[0.75em] font-normal no-underline text-muted/70 opacity-70 transition-opacity hover:text-slate-950 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 dark:text-[#8fb9b9] dark:hover:text-[#f7ead0] print:hidden",
              "aria-label": `Link to ${raw}`,
              title: "Link to this section",
            },
            children: [{ type: "text", value: "#" }],
          });

          tableOfContents.push({
            slug,
            level: Number(node.tagName.slice(1)),
            raw: text,
            text,
          });

          if (explicitId) {
            sections.push({ title: text, label: explicitId, slug });
          }
        },
      },
      {
        filter: ["a"],
        visit(node, context) {
          const className = node.properties?.className ??
            node.properties?.class;
          const classes = Array.isArray(className)
            ? className.map(String)
            : typeof className === "string"
            ? className.split(/\s+/)
            : [];
          const classProperty = node.properties &&
              Object.hasOwn(node.properties, "className")
            ? "className"
            : "class";

          if (classes.includes("no-underline")) {
            return;
          }

          context.setProperty(
            node,
            classProperty,
            Array.from(new Set(classes.concat("underline"))).join(" "),
          );
        },
      },
    ],
  });

  const result = await markdownToHtml(source, {
    features: {
      directive: true,
      frontmatter: true,
      gfm: true,
      headingAttributes: true,
    },
    mdastPlugins: [semantics],
    hastPlugins: [structure],
  });

  const unmatchedAlias = aliasSections.find((section) =>
    !matchedAliases.has(section)
  );

  if (unmatchedAlias) {
    throw new Error(
      `${sourcePath}: alias "${unmatchedAlias.label}" does not match heading slug "${unmatchedAlias.slug}"`,
    );
  }

  return {
    citationIds: Array.from(citationIds),
    content: result.html,
    frontmatter: result.frontmatter,
    sections,
    tableOfContents,
  };
}

function isCitationMode(value: string): value is CitationMode {
  return ["parenthetical", "textual", "full"].includes(value);
}

function attributeValue(value: string | null | undefined) {
  return value || undefined;
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\w]+/g, "-");
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type { Citation, Reference };
export default transformBookMarkdown;
