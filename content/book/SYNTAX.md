# Book Markdown syntax

Book chapters use standard Markdown wherever possible. Book-specific semantics
use Satteri directives so citations and cross-references remain structured and
can be validated at build time.

## Chapter structure

The page layout supplies the chapter title, so chapter files do not contain an
`h1`. Chapter titles, numbers, routes, and top-level reference labels come from
`index.json`.

Start numbered sections at level two. Level-two and level-three headings receive
generated section numbers and appear in the page table of contents. Level-four
headings represent LaTeX-style paragraph labels: they render as unnumbered bold
labels and do not appear in the table of contents.

```markdown
## Main section

### Subsection

#### Unnumbered paragraph label
```

## Heading references

Add an explicit id to any heading that other content needs to reference. The id
becomes both the public fragment and the reference label.

```markdown
## Why citing matters {#sec-citing-accuracy}

See :ref[sec-citing-accuracy].
See :ref[sec-citing-accuracy]{text="the earlier discussion"}.
```

Without custom text, `:ref` renders the numbered title of its target. Use
`text` to override that link text.

Use `target` when the bracket content should be custom link text or when the
target is a legacy LaTeX label containing a colon.

```markdown
See :ref[the LaTeX section]{target="sec:citing-in-latex"}.
```

Top-level chapter labels such as `ch:citing` and `ap:latex` are defined in
`index.json` and can be referenced in the same way.

## Reference aliases

Use an alias when a stable reference label must differ from the public heading
fragment. Place it immediately before the matching heading.

```markdown
::alias[Cite in LaTeX]{target="sec:citing-in-latex" slug="cite-in-latex"}

## Cite in LaTeX
```

The attributes are:

- `target`: stable label used by `:ref`.
- `slug`: public fragment of the matching heading.
- Bracket content: fallback title used while parsing.

The rendered link text inherits the heading number generated from `index.json`.
The build fails if the `slug` does not match a heading.

## Standalone anchors

Non-heading targets such as tables use a block anchor.

```markdown
The results appear in :ref[]{target="table:methods"}.

::anchor[table]{target="table:methods"}

| Method | Result |
| --- | --- |
| A | 42 |
```

The bracket content is the default link text. `target` is the stable reference
label. The public fragment defaults to a slugified form of `target`, such as
`table-methods`, and can be overridden with `slug`.

## Citations

Citation ids refer to entries in `bibliography.bib`. Parenthetical citations are
the default.

```markdown
:cite[source-id]
:cite[source-a, source-b]
:cite[source-id]{mode=textual}
:cite[source-id]{mode=full}
:cite[source-id]{locator="p. 42"}
:cite[source-id]{prefix="See " suffix=" for details"}
```

Supported modes are:

- `parenthetical`: renders author and year in parentheses.
- `textual`: renders the author as sentence text followed by the year.
- `full`: renders the full formatted bibliography entry without parentheses.

Multiple ids are comma-separated inside the brackets. Parenthetical and full
citations separate multiple entries with semicolons; textual citations use
commas. `locator` appends a page or section locator. `prefix` and `suffix` add
text directly before and after the rendered citation, including any spaces
provided in their values.

## Standard Markdown

Use standard Markdown for links, emphasis, lists, images, tables, and fenced
code blocks. GFM footnotes are enabled.

```markdown
A statement with supporting detail.[^detail]

[^detail]: The supporting detail.
```

Do not use raw HTML to implement citations or cross-references.

## Validation

The build rejects:

- Missing citation ids or reference labels.
- Duplicate reference labels.
- Empty or unsupported directives and citation modes.
- Aliases whose slugs do not match a heading.

Run `npm test` for syntax and full-book integration coverage. Run
`npm run build` to validate the complete reference graph while generating the
site.
