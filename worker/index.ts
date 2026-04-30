import { initRender } from "gustwind";
import { createCloudflareWorker } from "gustwind/workers/cloudflare";
import { plugin as configRouterPlugin } from "gustwind/routers/config-router";
import { plugin as edgeRendererPlugin } from "gustwind/plugins/htmlisp-edge-renderer";
import { plugin as metaPlugin } from "gustwind/plugins/meta";
import * as dataSources from "../site/dataSources.ts";
import * as globalUtilities from "../site/globalUtilities.ts";
import * as HeadingWithAnchor from "../site/components/HeadingWithAnchor.server.ts";
import * as Markdown from "../site/components/Markdown.server.ts";
import * as SiteLink from "../site/components/SiteLink.server.ts";
import meta from "../site/meta.json";
import routes from "../site/routes.json";
import {
  components,
  stylesheetHref,
  textFiles,
  themeToggleScriptHref,
} from "./generated/site-manifest.js";

const externalScripts = [
  {
    type: "text/javascript",
    src: "https://unpkg.com/sidewind@8.0.0/dist/sidewind.umd.production.min.js",
  },
];
const localScripts = themeToggleScriptHref
  ? [{ type: "module", src: themeToggleScriptHref }]
  : [];

const staticScriptPlugin = {
  meta: {
    name: "static-script-plugin",
    description: "Adds static script tags in Worker rendering.",
  },
  init() {
    return {
      prepareContext() {
        return { context: { scripts: externalScripts.concat(localScripts) } };
      },
    };
  },
};

const render = await initRender(initWorkerLoadApi, [
  [configRouterPlugin, {
    dataSourcesPath: "site/dataSources.ts",
    routesPath: "site/routes.json",
  }],
  [metaPlugin, { meta }],
  [staticScriptPlugin, {}],
  [edgeRendererPlugin, {
    components,
    componentUtilities: {
      HeadingWithAnchor,
      Markdown,
      SiteLink,
    },
    globalUtilities,
  }],
]);

export default createCloudflareWorker({
  render: async (pathname, initialContext) => {
    const result = await render(pathname, initialContext);

    return {
      ...result,
      markup: injectStylesheet(result.markup),
    };
  },
});

function initWorkerLoadApi() {
  return {
    dir() {
      return Promise.resolve([]);
    },
    json({ path }: { path: string }) {
      const normalizedPath = normalizePath(path);

      if (normalizedPath === "site/routes.json") {
        return Promise.resolve(routes);
      }

      if (normalizedPath === "site/meta.json") {
        return Promise.resolve(meta);
      }

      throw new Error(`Worker JSON asset was not found: ${normalizedPath}`);
    },
    module({ path }: { path: string }) {
      const normalizedPath = normalizePath(path);

      if (normalizedPath === "site/dataSources.ts") {
        return Promise.resolve(dataSources);
      }

      throw new Error(`Worker module asset was not found: ${normalizedPath}`);
    },
    textFile(path: string) {
      return Promise.resolve(readTextFile(path));
    },
    textFileSync(path: string) {
      return readTextFile(path);
    },
  };
}

function readTextFile(path: string) {
  const normalizedPath = normalizePath(path);
  const text = textFiles[normalizedPath as keyof typeof textFiles];

  if (typeof text !== "string") {
    throw new Error(`Worker text asset was not found: ${normalizedPath}`);
  }

  return text;
}

function normalizePath(path: string) {
  return path.replaceAll("\\", "/").replace(/^\/+/, "").replace(/^\.\//, "");
}

function injectStylesheet(markup: string) {
  if (!stylesheetHref || markup.includes(`href="${stylesheetHref}"`)) {
    return markup;
  }

  return markup.replace("</head>", `<link rel="stylesheet" href="${stylesheetHref}"></head>`);
}
