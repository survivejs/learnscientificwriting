import getMarkdown from "../transforms/markdown.ts";
import type { DataSourcesApi } from "gustwind";

function init({ load }: DataSourcesApi) {
  const markdown = getMarkdown(load);

  return {
    processMarkdown: async (input: string | { value: string }) =>
      (await markdown(typeof input === "string" ? input : input.value)).content,
  };
}

export { init };
