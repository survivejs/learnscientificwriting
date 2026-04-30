# Gustwind parser fixes to upstream

## 1. `\citep{...}` should render author-year citations

Patch: `patches/gustwind-upstream-citep-author-year.patch`

Current behavior in `gustwind@0.100.0` renders parenthetical citations as numeric placeholders, for example:

```txt
\citep{vepsalainen2023implications} -> (1)
\citep{vepsalainen2023implications, vepsalainen2023rise} -> (0)
```

Expected author-year output:

```txt
\citep{vepsalainen2023implications} -> (Vepsäläinen et al., 2023)
\citep{vepsalainen2023implications, vepsalainen2023rise} -> (Vepsäläinen et al., 2023; Vepsalainen et al., 2023)
```

The patch makes `citep` use the same BibTeX lookup path as `citet`, while formatting multiple entries with semicolons.

## 2. `\nameref{...}` needs section-label index data

The raw-id rendering we saw:

```txt
\nameref{sec:citing-in-latex} -> sec:citing-in-latex
```

was not caused by `refs().nameref` itself. Gustwind can render `nameref` correctly if `refEntries` contains the target label.

In this project, the missing piece was that our app-level book index only included top-level chapter and appendix labels. The local fix indexes labeled sections/subsections and adds them to the reference lookup set without adding them as routes.

This may still be worth upstream discussion as a feature: Gustwind could expose a helper to collect section labels from parsed LaTeX ASTs so consumers do not have to duplicate label/heading association logic.

## 3. BibTeX parser should support quoted values and LaTeX accents

Patch: `patches/gustwind-upstream-bibtex-parser.patch`

Current behavior can misparse valid BibTeX entries that use quoted values instead of braced values. For example:

```bibtex
@article{Knuth92,
  author = "D.E. Knuth",
  title = "Two notes on notation",
  journal = "Amer. Math. Monthly",
  volume = "99",
  year = "1992",
  pages = "403--422",
}
```

In our build, this caused the `author` field to swallow following fields and even following entries. The parser also only normalized a very narrow accent pattern, so valid BibTeX such as:

```bibtex
author={Veps{\"a}l{\"a}inen, Juho and Hellas, Arto and Vuorimaa, Petri}
```

could render as `Vepsalainen` after consumer-side cleanup.

Expected behavior:

```txt
author -> D.E. Knuth
title -> Two notes on notation
author -> Vepsäläinen, Juho and Hellas, Arto and Vuorimaa, Petri
```

The patch updates the BibTeX parser to read braced, quoted, and bare values, preserve nested braces in braced values, and normalize common LaTeX accent commands across all fields.
