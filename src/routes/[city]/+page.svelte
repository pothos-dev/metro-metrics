<script module>
  import Map from "ol/Map.js"
  import TileLayer from "ol/layer/Tile.js"
  import View from "ol/View.js"
  import VectorLayer from "ol/layer/Vector"
  import VectorSource from "ol/source/Vector"
  import { StadiaMaps } from "ol/source.js"
  import { Feature } from "ol"
  import { Geometry } from "ol/geom"
  import WKB from "ol/format/WKB.js"

  function createTileLayer() {
    return new TileLayer({
      source: new StadiaMaps({
        layer: "stamen_toner",
        apiKey: "1db73c1d-87b1-4581-b332-43563b7ab4bc",
      }),
      // className: "grayscale-[100%]",
    })
  }

  function createBoundaryLayer(geometry: Geometry) {
    return new VectorLayer({
      source: new VectorSource({
        features: [new Feature({ geometry })],
      }),
      style: {
        "stroke-color": "#000",
        "stroke-width": 8,
      },
    })
  }

  function createHexagonLayer(hexagons: Feature[]) {
    return new VectorLayer({
      source: new VectorSource({ features: hexagons }),
      style: {
        "stroke-color": "#0001",
        "stroke-width": 1,
        "fill-color": [
          "interpolate",
          ["linear"],
          ["get", "scale"],
          0,
          "#ff0000dd",
          0.5,
          "#ffff00dd",
          1,
          "#44ff44dd",
        ],
      },
    })
  }

  function createView(geometry: Geometry) {
    const bbox = geometry.clone()
    bbox.scale(2)
    const [left, bottom, right, top] = bbox.getExtent()
    const center = [left + (right - left) / 2, bottom + (top - bottom) / 2]

    return new View({
      projection: "EPSG:3857", // webMercator
      zoom: 1,
      center: center,
      extent: bbox.getExtent(),
    })
  }

  function toGeometry(geom: string) {
    return new WKB().readGeometry(geom)
  }
</script>

<script lang="ts">
  import { page } from "$app/stores"
  import { untrack } from "svelte"
  import type { Config, TooltipCategory } from "$lib/types"
  import ConfigEditor from "./ConfigEditor.svelte"
  import { first, round } from "lodash-es"
  import type { FeatureLike } from "ol/Feature"

  const { data } = $props()
  const boundary = toGeometry(data.city.geom)

  const map = new Map({
    layers: [createTileLayer(), createBoundaryLayer(boundary)],
    view: createView(boundary),
    controls: [],
  })

  let hexLayer: VectorLayer | null = null
  let config: Config = $state({
    categories: [
      {
        name: "Healthcare",
        enabled: true,
        weight: 1,
        pois: [
          {
            enabled: true,
            weight: 1,
            column: "amenity",
            value: "hospital",
            includePolygons: true,
            includePoints: false,
            includeLines: false,
            maxCount: 10,
            maxDistance: 1000,
          },
        ],
      },
    ],
  })

  let queryTime = $state(0)

  async function refetchHexagons() {
    if (hexLayer) map.removeLayer(hexLayer)

    const response = await fetch(`/${$page.params.city}`, {
      method: "POST",
      body: JSON.stringify(config),
    })

    const {
      hexagons,
      elapsed,
      statement,
      maxPercent,
      minPercent,
      error,
    }: {
      hexagons: any[]
      elapsed: number
      statement: string
      error: string
      maxPercent: number
      minPercent: number
    } = await response.json()

    console.log(statement)
    if (error) console.error(error)

    queryTime = elapsed

    const features = hexagons.map((hexagon) => {
      return new Feature({
        ...hexagon,
        scale: (hexagon.percent - minPercent) / (maxPercent - minPercent),
        geometry: toGeometry(hexagon.geom),
      })
    })

    hexLayer = createHexagonLayer(features)
    map.addLayer(hexLayer)
  }

  $effect(() => {
    // Restore from URL
    const url = new URL($page.url)
    if (url.searchParams.has("config")) {
      config = JSON.parse(atob(url.searchParams.get("config")!))
    }
  })

  $effect(() => {
    // Push to URL
    const url = new URL($page.url)
    url.searchParams.set("config", btoa(JSON.stringify(config)))
    history.pushState({}, "", url)
  })

  $effect(() => {
    untrack(() => {
      map.setTarget("map")
      refetchHexagons()
    })
  })

  let tooltip: HTMLElement | null = null
  let hoverHex: FeatureLike | null = $state(null)
  map.on("pointermove", (e) => {
    const hexagon = first(map.getFeaturesAtPixel(e.pixel))
    if (!hexagon) {
      hoverHex = null
      return
    }

    tooltip!.style.left = `${e.pixel[0] + 10}px`
    tooltip!.style.top = `${e.pixel[1] + 10}px`
    hoverHex = hexagon
  })
</script>

<div class="flex h-full w-full flex-row">
  <ConfigEditor bind:config onSubmit={refetchHexagons} />
  <div id="map" class="relative flex-1">
    <div
      bind:this={tooltip}
      class="absolute left-0 top-0 z-10 w-64 bg-white p-2 text-black"
    >
      {#if hoverHex}
        {@const tooltipCategories = hoverHex.get("categories")}
        {@const tooltipPercent = hoverHex.get("percent")}
        {@const id = hoverHex.get("id")}
        <div class="flex flex-row justify-between">
          <p class="font-bold">Hexagon {id}</p>
          <p>{round(tooltipPercent)}%</p>
        </div>
        {#each tooltipCategories as category}
          <div class="flex flex-row justify-between">
            <p class="font-bold">{category.category}</p>
            <p>{round(category.totalWeight, 1)}</p>
          </div>
          {#each category.features as feature}
            <div class="flex flex-row justify-between">
              <p>{feature.column}: {feature.value} ({feature.count})</p>
              <p>{round(feature.weight, 1)}</p>
            </div>
          {/each}
        {/each}
      {/if}
    </div>
    <div class="absolute right-0 top-0 z-10 bg-white text-black">
      <p>Time: {round(queryTime)}ms</p>
    </div>
  </div>
</div>
