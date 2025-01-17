<script lang="ts">
  import { CoordinateConverter } from "$lib/coordinates"
  import { generateHexGrid } from "$lib/hexagons"
  import { Map } from "$lib/map"
  import { onMount } from "svelte"

  let map: Map
  onMount(() => {
    map = new Map("map", 47.0707, 15.4395, 13)
  })

  let searchTerm = $state("")
  async function search() {
    await map.seek(searchTerm)
  }
  function scan() {
    const { minLat, minLon, maxLat, maxLon } = map.getBounds()
    const cc = new CoordinateConverter(minLat, minLon)
    const [left, top] = cc.toUTM(minLat, minLon)
    const [right, bottom] = cc.toUTM(maxLat, maxLon)

    const hexGrid = generateHexGrid(left, top, right, bottom, 500)
    for (const points of hexGrid) {
      map.addPolygon(points.map(([x, y]) => cc.toLatLon(x, y)))
    }
  }
</script>

<div class="relative h-full w-full bg-green-200">
  <div id="map" class="h-full w-full"></div>

  <form class="absolute right-0 top-0 z-[1000] p-4" onsubmit={search}>
    <input type="text" class="input input-bordered" bind:value={searchTerm} />
  </form>

  <div class="absolute bottom-0 right-0 z-[1000] p-4">
    <button class="btn btn-primary" onclick={scan}>Scan</button>
  </div>
</div>
