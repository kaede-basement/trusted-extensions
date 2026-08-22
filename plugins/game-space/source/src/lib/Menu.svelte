<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { globalStates } from '../utils';

  const loading = $state<Set<string>>(new SvelteSet);
  const games = $state<{ "value": Array<{
    "name"  : string;
    "image" : string;
    "shown" : boolean
    "action": () => Promise<void>;
  }> }>({ "value": (
    globalStates['config/game-space-imported']
      .filter(({ shown }) => shown)
      .map(entry => ({
        "name"  : entry.name,
        "image" : entry.image,
        "shown" : entry.shown,
        "action": () => launch(entry),
      }))
  ) });

  // @ts-ignore
  scopedThis.Extension.subscribe(
    () => [
      globalStates['config/game-space-imported'],
      // Watch length changes
      globalStates['config/game-space-imported'].length,
      // Watch 'shown' field changes
      globalStates['config/game-space-imported'].map(({ shown }) => shown),
    ],
    (): void => {
      games.value = globalStates['config/game-space-imported']
        .filter(({ shown }) => shown)
        .map(entry => ({
          "name"  : entry.name,
          "image" : entry.image,
          "shown" : entry.shown,
          "action": () => launch(entry),
        }));
    },
  )

  function launch(entry: typeof globalStates['config/game-space-imported'][number]): Promise<void> {
    if (entry.data.value === undefined) {
      throw new Error("The game path can't be undefined");
    }

    if (entry.data.kind === "steam") {
      return launchSteam(entry.name, `steam://rungameid/${entry.data.value}`);
    }

    return launchExecutable(entry.name, entry.data.value);
  }

  async function launchSteam(id: string, path: string): Promise<void> {
    loading.add(id);

    // @ts-ignore
    await window.__TAURI__.opener.openPath(path);

    loading.delete(id);
  }
  async function launchExecutable(id: string, path: string): Promise<void> {
    loading.add(id);

    const paths = path.split(window.__KAEDE__.internals.joinDelimiter);
    const file = paths.pop();

    if (!file) {
      return;
    }

    // @ts-ignore
    await window.__KAEDE__.libs.Processes.runProcess({
      "program": { "type": "path", "value": "cmd" },
      "args"   : ["/C", file],
      "cwd"    : paths.join(window.__KAEDE__.internals.joinDelimiter),
    });

    loading.delete(id);
  }
</script>

<div id="__game-space__menu-wrapper">
  {#if games.value.length <= 0}
    <div>
      <div>Nothing here :c</div>
      <div>You can add new games in the settings</div>
    </div>
  {/if}
  {#each games.value as game, index (`${game.name}-${index}`)}
    <button disabled={loading.has(game.name)} onclick={game.action} class="__game-space__card">
      <img class="__game-space__card-image" alt={`${game.name}'s logo'`} src={game.image} />
      <p class="__game-space__card-title">
        {game.name}
      </p>
    </button>
  {/each}
</div>