import { urlJoin as urlJoinFn } from "https://bundle.deno.dev/https://deno.land/x/url_join@1.0.0/mod.ts";
import type { DataSourcesApi } from "https://deno.land/x/gustwind@v0.77.2/types.ts";

function init(o: DataSourcesApi) {
  function urlJoin(...parts: string[]) {
    if (!parts.every((s) => typeof s === "string")) {
      console.error(parts);
      throw new Error("Failed to join url");
    }

    return urlJoinFn(...parts);
  }

  return { urlJoin };
}

export { init };
