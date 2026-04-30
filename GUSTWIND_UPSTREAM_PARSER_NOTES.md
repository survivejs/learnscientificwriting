# Gustwind parser notes

## `\-` should parse as a discretionary hyphen, not an unknown command

Status: Partially landed in Gustwind 0.105.0.

LaTeX uses `\-` to mark an optional hyphenation point. In prose, it should not
emit a literal hyphen or stop parsing the current content run.

Gustwind 0.105.0 handles this in regular content parsing. The local workaround
still strips `\-` before parsing because link text arguments such as
`\href{...}{Research\-Gate}` still leak the marker into rendered text.

Example:

```tex
dis\-cretionary
```

Expected parsed text:

```txt
discretionary
```

## `\nameref{...}` needs section-label index data

The raw-id rendering we saw:

```txt
\nameref{sec:citing-in-latex} -> sec:citing-in-latex
```

was not caused by `refs().nameref` itself. Gustwind can render `nameref` correctly if `refEntries` contains the target label.

In this project, the missing piece was that our app-level book index only included top-level chapter and appendix labels. The local fix indexes labeled sections/subsections and adds them to the reference lookup set without adding them as routes.

This may still be worth upstream discussion as a feature: Gustwind could expose a helper to collect section labels from parsed LaTeX ASTs so consumers do not have to duplicate label/heading association logic.
