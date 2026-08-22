import { mount, unmount } from 'svelte';
import App from './App.svelte';
import type { ActionKeyType, SettingsRowType, GlobalStatesType, SettingsRowCollectionType } from './types';

// @ts-expect-error It works
const { markRaw, computed, shallowReactive, nextTick } = window.__KAEDE__.packages.vue;
const { Configs, ContextMenu, Globals, Router } = window.__KAEDE__.libs;

let wrapper: HTMLDivElement;
const app = document.getElementById("__layout__wrapper")!;
const actionKey = "context-menu.open-modal" as ActionKeyType;
export const globalStates = window.__KAEDE__.states.globalStates as GlobalStatesType & Record<
  "config/game-space-imported",
  Array<{
    "name" : string;
    "image": string;
    "shown": boolean;
    "data" : { "kind": "path"; "value"?: string } | { "kind": "steam"; "value"?: number };
  }>
>;

export function open(): void {
  wrapper.style.zIndex = "7500";
  wrapper.style.opacity = "1";

  ContextMenu.close();
}
export function close(): void {
  wrapper.style.opacity = "0";
  wrapper.style.zIndex = "-50";
}

export function mountMenu(): () => void {
  wrapper = document.createElement("div");

  wrapper.setAttribute("id", "__game-space");
  wrapper.style.position = "absolute";
  app.append(wrapper);

  mount(App, {
    target: document.getElementById('__game-space')!,
  })

  return () => {
    unmount(App)
    wrapper.remove();
  };
}
export function modifyHost(): () => void {
  Globals.registerAction(actionKey, open);

  const unattachContextMenuItems = attachContextMenuItems();
  const unattachSettings = attachSettings();

  const lastMountRoute = globalStates.currentPage;

  // Re-trigger the changed tabs in Settings
  if (lastMountRoute === "settings") {
    Router.navigate("none");
    nextTick().then(() => Router.navigate(lastMountRoute));
  }

  return (): void => {
    unattachContextMenuItems();
    unattachSettings();

    const lastUnmountRoute = globalStates.currentPage;

    // Re-trigger the changed tabs in Settings
    if (lastUnmountRoute === "settings") {
      Router.navigate("none");
      nextTick().then(() => Router.navigate(lastUnmountRoute));
    }
  };
}
export function attachListeners(): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      close();
    }
  };
  const onClick = (event: MouseEvent) => {
    const target = event?.target;

    if (target === null || !("id" in target)) {
      return;
    }

    const id: unknown = target?.id;

    if (id === "__game-space") {
      close();
    }
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("click", onClick);

  return (): void => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("click", onClick);
  };
}
export function attachContextMenuItems(): () => void {
  globalStates.contextMenuItems.splice(1, 0, {
    "image" : "https://s3.getstickerpack.com/storage/uploads/sticker-pack/mahjong-soul-sticker-pack-1/sticker_2.png?5096be5fdf0c6eb177114fc63e8f058e&d=200x200",
    "name"  : "Games",
    "action": actionKey,
  });
  globalStates.contextMenuItems.splice(1, 0, "divider");

  // Trigger the reactivity
  globalStates.contextMenuItems = markRaw([...globalStates.contextMenuItems]);

  return (): void => {
    const startIndex: number = globalStates.contextMenuItems.findIndex(entry => entry !== "divider" && entry.name === "Games");

    if (startIndex === -1) {
      return;
    }

    globalStates.contextMenuItems.splice(startIndex, 2);

    // Trigger the reactivity
    globalStates.contextMenuItems = markRaw([...globalStates.contextMenuItems]);
  };
}
export function attachSettings(): () => void {
  if (
    !globalStates["config/game-space-imported"] ||
    !Array.isArray(globalStates["config/game-space-imported"])
  ) {
    globalStates["config/game-space-imported"] = [];
  }

  const actions = {
    "show": (index: number) => {
      globalStates["config/game-space-imported"][index].shown = true;
    },
    "hide": (index: number) => {
      globalStates["config/game-space-imported"][index].shown = false;
    },
    "forget": (index: number) => {
      globalStates["config/game-space-imported"] = globalStates["config/game-space-imported"]
        .filter((_, current) => current !== index);
    },
  } as const;

  const currentGame: typeof globalStates["config/game-space-imported"][number] = shallowReactive({
    "name" : "A Game",
    "image": "",
    "data" : { "kind": "steam", "value": undefined },
    "shown": true,
  });

  const rowItems: SettingsRowCollectionType = [
    computed((): SettingsRowType => ({
      "idRoot"  : "__game-space__label",
      "title"   : "Game label",
      "subtitle": "Specify the game label",
      "icon"    : "__kaede-do-not-render",
      // @ts-ignore
      "inner"   : {
        "kind"        : "input",
        "debounceTime": 200,
        "icon"        : "i-lucide-box",
        "placeholder" : "Label",
        "defaultValue": currentGame.name,
        "onInput"     : (value: string): void => {
          currentGame.name = value;
        },
      },
    })),
    computed((): SettingsRowType => ({
      "idRoot"  : "__game-space__image",
      "title"   : "Game image",
      "subtitle": "Specify the game image",
      "icon"    : "__kaede-do-not-render",
      // @ts-ignore
      "inner"   : {
        "kind"        : "input",
        "debounceTime": 200,
        "icon"        : "i-lucide-box",
        "placeholder" : "URL",
        "defaultValue": currentGame.image,
        "onInput"     : (value: string): void => {
          currentGame.image = value;
        },
        "filePicker": {
          "icon"  : "i-lucide-folder",
          "onPick": (picked: string): void => {
            currentGame.image = picked;
          },
        },
      },
    })),
    computed((): SettingsRowType => ({
      "idRoot"  : "__game-space__switcher",
      "title"   : "Game type",
      "subtitle": "Do you want to save the game as a SteamID or an executable path",
      "icon"    : "__kaede-do-not-render",
      "inner"   : {
        "kind"    : "select",
        "value"   : currentGame.data.kind === "path" ? "Local" : "Steam",
        "options" : [
          { "id": "steam", "label": "Steam" },
          { "id": "path", "label": "Local" },
        ],
        "onSelect": ({ id }): void => {
          currentGame.data = {
            "kind" : id as "steam" | "path",
            "value": undefined,
          };
        },
      },
    })),
    computed((): SettingsRowType => (currentGame.data.kind === "path" ? {
      "idRoot"  : "__game-space__selector-path",
      "title"   : "Game path",
      "subtitle": "Write the path of the game or select its executable",
      "icon"    : "__kaede-do-not-render",
      "inner"   : {
        "kind"        : "input",
        "debounceTime": 200,
        "icon"        : "i-lucide-box",
        "placeholder" : "Path",
        "defaultValue": currentGame.data.value,
        "onInput"     : (value: string): void => {
          currentGame.data = { "kind": "path", value };
        },
        "filePicker"  : {
          "icon"  : "i-lucide-folder",
          "onPick": (_: string, original: string): void => {
            currentGame.data = { "kind": "path", "value": original };
          },
        },
      },
    } : {
      "idRoot"  : "__game-space__selector-steam",
      "title"   : "SteamID",
      "subtitle": "Write the game SteamID",
      "icon"    : "__kaede-do-not-render",
      "inner"   : {
        "kind"        : "input",
        "debounceTime": 200,
        "icon"        : "i-lucide-box",
        "placeholder" : "SteamID",
        "defaultValue": currentGame.data.value,
        "onInput"     : (value: string): void => {
          currentGame.data = { "kind": "steam", "value": Number(value) };
        },
      },
    })),
    computed((): SettingsRowType => ({
      "idRoot"  : "__game-space__saver",
      "icon"    : "__kaede-do-not-render",
      "image"   : currentGame.image,
      "title"   : "Save the game",
      "subtitle": `Label: "${currentGame.name}"; Path: "${currentGame.data?.value}"`,
      "onClick" : () => {
        globalStates["config/game-space-imported"].push({ ...currentGame });
        currentGame.image = "";
        currentGame.name = "";
        currentGame.data = { "kind": currentGame.data.kind, "value": undefined };
      },
      "inner" : {
        "kind": "button",
        "label": "Yes",
      },
    })),
    computed(() => ({ "idRoot": "__game-space__divider-1", "separate": "~" })),
    computed((): SettingsRowType => ({
      "idRoot"  : "__game-space__wrapper",
      "icon"    : "__kaede-do-not-render",
      "title"   : "Current games",
      "subtitle": "See your currently added games",
      "empty"  : {
        "idRoot"  : "__game-space__empty",
        "title"   : "None",
        "subtitle": "Add a new game above",
      },
      "inner"  : globalStates["config/game-space-imported"].map((entry, index): SettingsRowType => ({
        "idRoot"  : `__game-space__entry-${index}`,
        "title"   : entry.name,
        "image"   : entry.image,
        "subtitle": entry.data.value?.toString?.(),
        "inner"   : globalStates["config/game-space-imported"].length <= 0 ? undefined : {
          "kind"    : "select",
          "value"   : entry.shown ? "Show" : "Hide",
          "options" : [
            { "id": "show", "label": "Show" },
            { "id": "hide", "label": "Hide" },
            { "id": "forget", "label": "Forget" },
          ],
          "onSelect": ({ id }): void => {
            switch (id) {
              case "show":
              case "hide":
              case "forget": {
                actions[id](index);
                void Configs.sync();
              }
            }
          },
        },
      })),
    })),
  ];

  window.__KAEDE__.constants.RowCollections.CustomRows["game-space"] = rowItems;
  window.__KAEDE__.constants.Application.SettingsSections.push({
    "id"   : "game-space",
    "name" : "Games",
    "image": "https://s3.getstickerpack.com/storage/uploads/sticker-pack/ichihime/sticker_1.png?6a40e021d3aff4079c3bb733554ce66d&d=200x200",
  });

  return (): void => {
    const index = window.__KAEDE__.constants.Application.SettingsSections
      .findIndex(({ id }) => id === "game-space");

    if (index !== -1) {
      window.__KAEDE__.constants.Application.SettingsSections.splice(index, 1);
    }
      
    delete window.__KAEDE__.constants.RowCollections.CustomRows["game-space"];
  };
}