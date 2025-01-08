import getMarkdown from "../transforms/markdown.ts";
import type { DataSourcesApi } from "https://deno.land/x/gustwind@v0.77.2/types.ts";

function init({ load }: DataSourcesApi) {
  const markdown = getMarkdown(load);

  return {
    processMarkdown: async (input: string) => (await markdown(input)).content,
  };
}

export { init };
