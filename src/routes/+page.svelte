<script module>
  import { queryOverpass } from "$lib/osm-api"
  import L from "leaflet"
  import "leaflet.heat/dist/leaflet-heat.js"
  import "leaflet.markercluster/dist/MarkerCluster.css"
  import "leaflet.markercluster/dist/MarkerCluster.Default.css"
  import "leaflet.markercluster"
  import "leaflet.awesome-markers/dist/leaflet.awesome-markers.css"
  import "leaflet.awesome-markers/dist/leaflet.awesome-markers.js"
  import "leaflet/dist/leaflet.css"

  async function fetchCategory({
    bbox,
    category,
  }: {
    bbox: L.LatLngBounds
    category: Category
  }) {
    const query = `
      (
        ${category.features
          .map((feature) => `way[${feature.column}=${feature.value}];`)
          .join("\n")}
      );
      out center qt;
    `
    type Result = {
      center: { lat: number; lon: number }
      tags: Record<string, any>
    }

    const results = await queryOverpass<Result>(bbox, query)
    const resultsWithFeature = results.map(({ center, tags }) => ({
      center,
      tags,
      feature: category.features.find(
        (feature) => tags[feature.column] == feature.value
      )!,
    }))

    const maxWeight = max(category.features.map((feature) => feature.weight))!

    function makeIcon(feature: Feature) {
      const size = feature.maxDistance / 10
      const opacity = feature.weight / maxWeight

      return L.divIcon({
        className: "custom-div-icon",
        html: `<div style='background-color: ${category.color}; opacity: ${opacity};' class='marker-pin'></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })
    }

    const markers = resultsWithFeature.map(({ center, tags, feature }) =>
      L.marker([center.lat, center.lon], {
        title: tags.name,
        icon: makeIcon(feature),
      })
    )
    const markerLayer = L.layerGroup(markers)

    const heatMarkers = resultsWithFeature.map(({ center, feature }) => {
      const lat = center.lat
      const lon = center.lon
      const weight = feature.weight
      // const weight = feature.weight / maxWeight
      return [lat, lon, weight]
    })

    const heatLayer = (L as any).heatLayer(heatMarkers, {
      radius: category.heatmapRadius,
      // blur: 15,
      // gradient: { 0: "#0000", 1: category.color },
    })

    return { markerLayer, heatLayer }
  }
</script>

<script lang="ts">
  import { baseLayer } from "$lib/map"
  import { queryNominatim } from "$lib/osm-api"
  import { onMount } from "svelte"
  import { config, type Category, type Feature } from "$lib/config"
  import { max } from "lodash-es"

  let map: L.Map
  let heatLayers = L.layerGroup()
  let pointLayers = L.layerGroup()

  let loading = $state(false)
  let searchTerm = $state("")
  let viewMode = $state("points" as "points" | "heatmap")
  let categories = $state(
    config.categories.map((category, i) => ({
      ...category,
      enabled: i == 0,
      heatLayer: null as L.Layer | null,
      markerLayer: null as L.Layer | null,
    }))
  )

  onMount(() => {
    if (!map) {
      map = new L.Map("map")
      map.setView([47.0707, 15.4395], 13)
      map.addLayer(baseLayer)
      map.addLayer(heatLayers)
      map.addLayer(pointLayers)
    }
  })

  $effect(() => {
    if (viewMode === "points") {
      map.removeLayer(heatLayers)
      map.addLayer(pointLayers)
    } else {
      map.removeLayer(pointLayers)
      map.addLayer(heatLayers)
    }
  })

  function setCategory(category: Category) {
    for (const c of categories) {
      c.enabled = c.name === category.name
    }
  }

  $effect(() => {
    for (const category of categories) {
      if (!category.enabled && category.heatLayer) {
        heatLayers.removeLayer(category.heatLayer)
      }
      if (!category.enabled && category.markerLayer) {
        pointLayers.removeLayer(category.markerLayer)
      }
      if (category.enabled && category.heatLayer) {
        heatLayers.addLayer(category.heatLayer)
      }
      if (category.enabled && category.markerLayer) {
        pointLayers.addLayer(category.markerLayer)
      }
    }
  })

  function toggleViewMode() {
    viewMode = viewMode === "points" ? "heatmap" : "points"
  }

  async function search() {
    loading = true
    map.fitBounds(await queryNominatim(searchTerm))
    loading = false
  }

  async function scan() {
    for (const category of categories) {
      const { markerLayer, heatLayer } = await fetchCategory({
        bbox: map.getBounds(),
        category,
      })

      if (category.enabled) {
        pointLayers.addLayer(markerLayer)
        heatLayers.addLayer(heatLayer)
      }

      category.markerLayer = markerLayer
      category.heatLayer = heatLayer
    }
  }
</script>

<div class="relative h-full w-full bg-green-200">
  <div id="map" class="h-full w-full"></div>

  <div class="absolute right-0 top-0 z-[1000] flex flex-col gap-2 p-4">
    <div class="flex flex-row items-end gap-2">
      <form onsubmit={search}>
        <input
          type="text"
          class="input input-bordered"
          bind:value={searchTerm}
        />
      </form>
      <button class="btn btn-outline" onclick={scan}>
        {#if loading}
          <span class="loading loading-dots loading-sm"></span>
        {:else}
          Scan
        {/if}
      </button>
    </div>

    <ul class="flex flex-col overflow-clip rounded-md">
      {#each categories as category}
        <li>
          <button
            class="w-full p-2 text-right text-white"
            class:opacity-20={!category.enabled}
            style="background-color: {category.color};"
            onclick={() => setCategory(category)}
          >
            {category.name}
          </button>
        </li>
      {/each}
    </ul>

    <button class="btn btn-ghost ml-auto text-white" onclick={toggleViewMode}>
      <input type="checkbox" class="toggle" checked={viewMode === "heatmap"} />
      {viewMode === "points" ? "Points" : "Heatmap"}
    </button>
  </div>
</div>
