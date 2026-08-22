// @ts-nocheck
// import { KaedeNamespaceType } from "./src/types";

const { globalStates } = window.__KAEDE__.states;

declare global {
  interface Window {
    "__KAEDE__": KaedeNamespaceType;
  }
}

declare const scopedThis: {
  "Extension": any,
};

if (
  !globalStates["config/hmr-port"] ||
  typeof globalStates["config/hmr-port"] !== "number" ||
  Number.isNaN(globalStates["config/hmr-port"])
) {
  // The default port
  globalStates["config/hmr-port"] = 5199;
}

const { computed } = (window.__KAEDE__.packages.vue as any);

window.__KAEDE__.constants.RowCollections.DevelopmentSettingsRows.unshift(computed(() => ({
  "idRoot"  : "__settings-page__development-hmr-plugin-separate",
  "separate": "~",
})));
window.__KAEDE__.constants.RowCollections.DevelopmentSettingsRows.unshift(computed(() => ({
  "idRoot"  : "__settings-page__development-hmr-plugin-port",
  "icon"    : "i-lucide-settings",
  "title"   : "Vite server port",
  "subtitle": "Change the port of a Vite development server",
  "inner"   : {
    "kind"        : "input",
    "icon"        : "i-lucide-settings",
    "placeholder" : "Port",
    "debounceTime": 300,
    "defaultValue": globalStates["config/hmr-port"],
    "onInput"     : (value: string): void => {
      const parsed: number = Number(value);

      if (Number.isNaN(parsed)) {
        return;
      }

      globalStates["config/hmr-port"] = parsed;
    },
  },
})));

// IPv4 loopback to match the dev server's `host: "127.0.0.1"` (avoids the
// Windows `localhost` -> `::1` IPv6 mismatch).
const DEV_SERVER_ENTRY = `http://127.0.0.1:${globalStates["config/hmr-port"]}/src/main.ts`;

// The real plugin is served by the Vite dev server and runs as a normal ESM
// module (outside this AsyncFunction's scope). Bridge Kaede's ExtensionAPI onto
// the global scope so the plugin can keep using `Kaede.subscribe(...)`.
(globalThis as any).scopedThis = scopedThis;

// `DEV_SERVER_ENTRY` is a variable (not an inline string) so Rollup leaves the
// dynamic import untouched instead of trying to bundle the http URL.
import(DEV_SERVER_ENTRY)
  .then((response: unknown): void => {
    const message: string = `Plugin loaded from ${DEV_SERVER_ENTRY} (HMR active)`;

    window.__KAEDE__.libs.Logging.log.info("hmr:65", message, JSON.stringify(response));
    console.info(message);
  })
  .catch((error: unknown): void => {
    const message: string = `Failed to load ${DEV_SERVER_ENTRY}. Is the dev server running? Error:`;
    const prettified: string = window.__KAEDE__.libs.Errors.prettify(error);

    window.__KAEDE__.libs.Logging.log.error("hmr:65", message, prettified);
    console.error(message, prettified);
  });

scopedThis.Extension.subscribe("lifecycle::disable::after", async () => {
  void window.__KAEDE__.libs.Configs
    .sync()
    .then(() => window.location.reload());
});
