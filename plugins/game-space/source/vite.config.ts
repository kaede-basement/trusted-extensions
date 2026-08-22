import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), cssInjectedByJsPlugin()],
  build: {
    outDir: "../",
    rollupOptions: {
      input: "./src/main.ts",
      output: {
        entryFileNames: "game-space.js",
      },
    },
  },
})
