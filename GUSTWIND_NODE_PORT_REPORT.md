# Gustwind Node package fixes

This report was written while porting this project from Deno Gustwind to
`gustwind@0.97.0` from npm.

## Missing runtime dependencies

The npm package appears to use packages that are not declared in Gustwind's own
runtime dependencies. The project had to install these directly for the Node
build to work reliably:

```json
{
  "parse5": "7.2.1",
  "vite": "7.1.12"
}
```

Expected fix: add any packages imported by Gustwind itself to
`gustwind/package.json`, so consumers do not have to install transitive runtime
dependencies manually.

## LaTeX/htmlisp parser internals are not exported

This project uses these Gustwind parser and rendering helpers:

```ts
htmlispToHTMLSync
astToHTMLSync
parseLatex
parseBibtexCollection
blocks
cites
doubles
el
lists
refs
singles
```

In Deno, these were importable from paths such as:

```ts
https://deno.land/x/gustwind@v0.81.4/htmlisp/parsers/latex/parseLatex.ts
```

The npm package does not expose equivalent JavaScript exports. It ships some
`htmlisp/**/*.d.ts` files and bundles related code inside renderer plugins, but
there are no stable public JS entry points for these helpers.

Current workaround: the Node Gustwind build still imports these parser helpers
from `deno.land`.

Expected fix: publish and export these modules from npm, either as individual
subpath exports:

```json
{
  "./htmlisp/htmlispToHTMLSync": "./htmlisp/htmlispToHTMLSync.js",
  "./htmlisp/utilities/astToHTMLSync": "./htmlisp/utilities/astToHTMLSync.js",
  "./htmlisp/parsers/latex/parseLatex": "./htmlisp/parsers/latex/parseLatex.js",
  "./htmlisp/parsers/latex/parseBibtexCollection": "./htmlisp/parsers/latex/parseBibtexCollection.js",
  "./htmlisp/parsers/latex/defaultExpressions": "./htmlisp/parsers/latex/defaultExpressions.js"
}
```

Or as an aggregate export:

```ts
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
```

## Component utility input shape changed

A component utility that previously received a raw string now sometimes receives
an object like this:

```ts
{ value: string }
```

The port had to support both forms:

```ts
processMarkdown: async (input: string | { value: string }) =>
  (await markdown(typeof input === "string" ? input : input.value)).content
```

Expected fix: document this input shape, or preserve the previous raw string
behavior if the change was accidental.

## No direct Node Twind plugin equivalent

The old Deno config used Gustwind's Twind plugin:

```json
"${GUSTWIND_PATH}/plugins/twind/mod.ts"
```

The npm package exposes the Tailwind plugin instead:

```json
"./node_modules/gustwind/plugins/tailwind/mod.js"
```

The migration works, but it requires adding a Tailwind CSS entry file and a
Tailwind setup module.

Expected fix: document this migration path for Deno Twind users, or expose a
Node Twind plugin if Twind is still intended to be supported.

## htmlisp utilities are bundled but not reusable

The npm package includes code for utilities such as `htmlispToHTMLSync` and
`astToHTMLSync` inside:

```txt
plugins/htmlisp-renderer/mod.js
```

Only the renderer plugin itself is exported from that file. Consumers cannot
reuse the lower-level helpers without duplicating code or importing the older
Deno URLs.

Expected fix: split reusable htmlisp utilities into public npm modules and
export them. That would remove the last Deno dependency from Node projects that
use Gustwind's lower-level parser/rendering APIs.
