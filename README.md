# learnscientificwriting.com

This is the source for `learnscientificwriting.com`. See `npm run` for available commands.

This project uses Node.js 24. Version managers can read the pinned version from `.nvmrc` or `.node-version`.

To get started, run `npm install` and then `npm run start` to run the development server. To generate a build, use `npm run build`.

The book source lives in `content/book`. Its route metadata is defined in
`content/book/index.json`, and [the Markdown syntax reference](content/book/SYNTAX.md)
documents the extensions used for citations and cross-references.

To deploy the precompiled site as Cloudflare static assets, run `npm run deploy`.
