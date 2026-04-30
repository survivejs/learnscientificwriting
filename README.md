# learnscientificwriting.com

This is the source for `learnscientificwriting.com`. See `npm run` for available commands.

This project uses Node.js 24. Version managers can read the pinned version from `.nvmrc` or `.node-version`.

To get started, run `npm install`, `npm run bootstrap`, and then `npm run start` to run the development server. To generate a build, use `npm run build`.

To deploy as a Cloudflare Worker, run `npm run deploy`. The Worker build uses `npm run worker:build`, which generates the static Gustwind build and bundles the source content needed by the Worker renderer.
