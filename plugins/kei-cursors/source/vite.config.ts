import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: "./src/main.ts",
      formats: ["iife"],
      name: "KeiCursors",
      fileName: "cursors",
    },
    /*
     * rollupOptions: {
     *   external: ["vue"],
     *   output: {
     *     inlineDynamicImports: true,
     *     manualChunks: undefined,
     *     globals: {
     *       vue: "window.__KAEDE__.packages.vue",
     *     },
     *   },
     * },
    */
  },
  plugins: [cssInjectedByJsPlugin()],
  base   : "./",
})
