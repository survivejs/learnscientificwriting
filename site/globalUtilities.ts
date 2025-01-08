import { urlJoin } from "https://bundle.deno.dev/https://deno.land/x/url_join@1.0.0/mod.ts";
import type { DataSourcesApi } from "https://deno.land/x/gustwind@v0.77.2/types.ts";

function init(o: DataSourcesApi) {
  // Add your global page utilities here.
  // Alternatively they can be defined per component.
  return { urlJoin };
}

export { init };
