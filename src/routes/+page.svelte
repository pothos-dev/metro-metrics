<script lang="ts">
  import { Map } from "$lib/map"
  import { onMount } from "svelte"

  let map: Map | undefined
  onMount(() => {
    map = new Map("map", 47.0707, 15.4395, 13)
  })

  let searchTerm = $state("")
  async function search() {
    await map?.seek(searchTerm)
  }
</script>

<div class="relative h-full w-full bg-green-200">
  <div id="map" class="h-full w-full"></div>

  <form class="absolute right-0 top-0 z-[1000] p-4" onsubmit={search}>
    <input type="text" class="input input-bordered" bind:value={searchTerm} />
  </form>

  <div class="absolute bottom-0 right-0 z-[1000] p-4">
    <button class="btn btn-primary">Scan</button>
  </div>
</div>
