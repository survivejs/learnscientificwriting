# Scholarmark integration requirements

> Status: implemented in Scholarmark 0.3.0 and integrated into this project.
> This document is retained as the design and acceptance record.

This document describes the small upstream additions needed to replace the
custom scientific Markdown implementation in
[`survivejs/learnscientificwriting`](https://github.com/survivejs/learnscientificwriting)
with [`scholarmark`](https://github.com/bebraw/scholarmark).

The current Scholarmark API already covers most of the required behavior:

- Markdown and GFM parsing, including footnotes and fenced code
- scientific directives and their validation
- BibTeX parsing and citation formatting hooks
- numbered level-two and level-three headings
- level-four paragraph labels
- heading metadata for navigation
- sanitized HAST through `renderTree()`

The remaining blocker is reference resolution across separately rendered
documents.

## Use case: a multi-document publication

The book consists of 15 Markdown files. Each chapter is rendered as a separate
HTML page, but citations and references belong to one publication-wide graph.

For example, a chapter can contain:

```markdown
See :ref[ch:technology].
See :ref[sec:citing-in-latex].
```

The referenced chapter or section may be declared in a different Markdown
file. The host application already knows the publication-wide targets and can
provide entries such as:

```ts
new Map([
  [
    "ch:technology",
    {
      title: "11. Technology",
      href: "/book/technology/",
    },
  ],
  [
    "sec:citing-in-latex",
    {
      title: "A.5 Cite in LaTeX",
      href: "/book/latex/#cite-in-latex",
    },
  ],
]);
```

Scholarmark 0.2.0 resolves only `::label` declarations found in the Markdown
string currently being rendered. Consequently, a valid cross-document
reference produces a `Missing label` diagnostic and a document-local fragment
link.

## Required capability: host-provided reference targets

Allow the host to provide reference targets when rendering or diagnosing a
document. The exact API name is flexible. One possible shape is:

```ts
export interface ReferenceTarget {
  /** Default visible text when :ref does not provide a text attribute. */
  readonly title: string;

  /** Complete destination, including a path and optional fragment. */
  readonly href: string;
}

export interface MarkdownRenderOptions {
  readonly headingNumbers?: HeadingNumbers;
  readonly citationFormatter?: CitationFormatter;
  readonly referenceTargets?: ReadonlyMap<string, ReferenceTarget>;
}
```

Equivalent support is needed on asynchronous and synchronous rendering paths.
If `diagnose()` remains a separate public entry point, it should accept the
same reference context or an equivalent validation option.

### Resolution behavior

For `:ref[target]`:

1. Resolve a matching host-provided target, if one exists.
2. Otherwise resolve a matching local `::label[target]`.
3. Use `{text="custom text"}` when present.
4. Otherwise use the resolved target's title.
5. Use the resolved target's complete `href` without prefixing it with `#` or
   slugifying it.
6. Report `Missing label: target` only when neither source contains the target.

Local and host targets may overlap after the publication index has been built.
Host-first precedence is required here: the host may need to route a semantic
label to a public fragment that differs from the label itself, even when the
label is declared in the current chapter. Without host context, local labels
continue to make a document self-contained. An explicit precedence option is
also acceptable if the host can select host-first behavior.

### Rendered identity

Please preserve the original reference label in the rendered tree. For
example:

```html
<a
  class="semantic-reference"
  data-reference="sec:citing-in-latex"
  href="/book/latex/#cite-in-latex"
>A.5 Cite in LaTeX</a>
```

`data-reference` is useful for trusted host-side HAST transformations and
debugging. It also avoids reparsing source ranges merely to recover the label.
It must be admitted by Scholarmark's sanitizer.

## Helpful metadata addition

This part is not strictly required for rendering, but it would make
multi-document indexing substantially cleaner.

Expose the reference targets declared by the current document after IDs and
heading numbers have been allocated:

```ts
export interface RenderedReferenceTarget {
  readonly label: string;
  readonly title: string;
  readonly fragment: string;
  readonly from: number;
  readonly to: number;
}

export interface RenderedDocument {
  readonly html: string;
  readonly diagnostics: Diagnostic[];
  readonly headings: RenderedHeading[];
  readonly references: RenderedReferenceTarget[];
}
```

The host can then render or analyze every chapter once, combine these targets
with heading metadata and its routing policy, and pass the resulting
publication-wide map into the final render. `fragment` is the target's default
local fragment; a host may deliberately substitute an attached heading's
public ID when preserving an older URL scheme. The metadata should cover labels
attached to headings, tables, figures, and ordinary blocks.

If expanding `RenderedDocument` is undesirable, an exported analysis helper
that returns the same resolved metadata would be sufficient. The existing
`publicationReferenceLabels()` helper returns useful titles, but it does not
provide the final rendered fragment or source range.

## Public fragment compatibility

The current book distinguishes stable semantic labels from public URL
fragments. For example:

```text
label: sec:citing-in-latex
fragment: cite-in-latex
```

Scholarmark currently treats the label as the fragment. The book can retain its
semantic labels during migration—for example, `::alias` can become
`::label[sec:citing-in-latex]`—while the host-provided target maps that label to
the existing public heading URL, `/book/latex/#cite-in-latex`. This is why
host-provided targets must be allowed to override locally declared targets.

Existing public fragments must remain stable, but no upstream alias syntax is
required unless Scholarmark wants to support the
semantic-label/public-fragment distinction inside the language itself.

## Diagnostics contract

The host uses diagnostics as build validation. The integration needs to be
able to distinguish a successful render from a document containing semantic
errors.

Expected behavior:

- A host-resolved reference does not produce `Missing label`.
- An unresolved reference still produces `Missing label` with the authored
  source range.
- Unsupported attributes and empty reference IDs remain errors.
- Duplicate local labels remain errors.
- Supplying external reference targets does not weaken citation, directive,
  label, or native-figure validation.
- Parser failures remain bounded diagnostics rather than thrown exceptions,
  consistent with the existing Scholarmark contract.

## Suggested acceptance tests

### Resolve an external target

```ts
const rendered = await render(
  "See :ref[ch:technology].",
  "",
  "apa",
  {
    referenceTargets: new Map([
      [
        "ch:technology",
        {
          title: "11. Technology",
          href: "/book/technology/",
        },
      ],
    ]),
  },
);

expect(rendered.diagnostics).toEqual([]);
expect(rendered.html).toContain('href="/book/technology/"');
expect(rendered.html).toContain('data-reference="ch:technology"');
expect(rendered.html).toContain(">11. Technology</a>");
```

### Preserve custom text

```ts
const rendered = await render(
  ':ref[ch:technology]{text="the tools chapter"}',
  "",
  "apa",
  { referenceTargets },
);

expect(rendered.html).toContain(">the tools chapter</a>");
expect(rendered.html).toContain('href="/book/technology/"');
```

### Keep unresolved references invalid

```ts
const rendered = await render(":ref[ch:missing]", "", "apa", {
  referenceTargets: new Map(),
});

expect(rendered.diagnostics).toContainEqual(
  expect.objectContaining({
    severity: "error",
    message: "Missing label: ch:missing",
  }),
);
```

### Support the synchronous renderer

The same input and reference map should produce equivalent HTML and diagnostics
through `renderSync()`.

### Expose local target metadata

```ts
const source = "::label[sec:methods]\n\n## Methods";
const rendered = await render(
  source,
  "",
  "apa",
  {
    headingNumbers: {
      [source.indexOf("## Methods")]: "3.2",
    },
  },
);

expect(rendered.references).toContainEqual(
  expect.objectContaining({
    label: "sec:methods",
    title: "3.2 Methods",
    fragment: "sec:methods",
  }),
);
```

## Host-side work after the upstream change

Once this capability is published, `learnscientificwriting` can:

1. Migrate `::alias` and `::anchor` declarations to `::label`.
2. Migrate `:ref[]{target="id"}` to `:ref[id]` and use the existing `text`
   attribute for custom link text.
3. Build a publication-wide reference map from the book index and chapter
   target metadata.
4. Pass raw BibTeX and the reference map to `renderTree()`.
5. Derive the page table of contents from `rendered.headings`.
6. Apply a small trusted HAST transform for site classes, heading permalinks,
   and links from citations to the book's references page.
7. Treat error diagnostics as build failures.
8. Remove the custom directive parser and the `satteri` dependency.

The HAST transform is presentation integration rather than a second Markdown
implementation. Parsing, scholarly semantics, sanitization, and validation
would all come from Scholarmark.

## Non-goals

The upstream change does not need to know about:

- Gustwind routes or layouts
- the book's Tailwind classes
- chapter numbering conventions beyond the existing `headingNumbers` option
- the site's heading permalink markup
- the `/book/references/` citation destination
- the legacy `::alias`, `::anchor`, or `target=` syntax

Those concerns can remain in the host migration layer.
