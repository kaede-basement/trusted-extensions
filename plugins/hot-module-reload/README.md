# README

For a working Hot Module Reload (HMR) in Vue plugins that use an externalized & shared Vue package (`window.__KAEDE__.packages.vue`), you need a special Kaede build that is obtained by running `bun build:hmr` inside a Kaede repository. This is needed so that `__VUE_HMR_RUNTIME__` is available for vite to actually be able to trigger Vue HMR. You can also launch the Kaede in a dev mode (`bun dev`) since the development build also has a development Vue bundle that has `__VUE_HMR_RUNTIME__` exposed.

This plugin was tested with `vite dev --port 5199` in Vue 3 and Svelte 5 plugins.
