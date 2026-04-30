# Gustwind OG plugin notes

## Make generated OG asset paths configurable and URL-safe

Patch: `patches/gustwind-upstream-og-plugin-options.patch`

The layout-based OG plugin works well for replacing site-specific OG generators.
The remaining upstream polish is mostly around making it reusable across sites:

- Keep `layout` explicit and fail with a clear error if it is missing.
- Allow the generated image name to be configured through `output`, defaulting to
  `og.png`.
- Allow skipped route suffixes to be configured through `skipExtensions`,
  defaulting to `.html` and `.xml`.
- Use `path.posix.join` and normalize leading/trailing slashes for URL-derived
  output paths, so generated asset keys remain slash-based on Windows too.

Example plugin configuration:

```json
{
  "path": "./node_modules/gustwind/plugins/og/mod.js",
  "options": {
    "layout": "./site/layouts/og.html",
    "output": "og.png"
  }
}
```

## Render OG layouts with the same utilities as normal pages

Patch: `patches/gustwind-upstream-og-render-context.patch`

The OG plugin currently asks `htmlisp-renderer-plugin` only for components.
That is enough for plain SVG templates, but it means OG layouts cannot use the
same global utilities or component utilities available to normal page layouts.

The patch exposes a `getRenderContext` message from the HTMLisp renderer plugin.
The OG plugin can then render its layout with:

- `components`
- route-aware `componentUtilities`
- route-aware global `utilities`

This keeps OG image templates aligned with normal Gustwind layouts and avoids
duplicating formatting, URL, or helper logic in image-specific templates.
