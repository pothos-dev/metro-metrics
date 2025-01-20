import { config } from "$lib/config"
import { queryOverpass } from "$lib/osm-api"

export async function GET({ request }) {
  const { searchParams } = new URL(request.url)
  // Default to Graz BBox
  const west = Number(searchParams.get("west") ?? 15.33245086669922)
  const south = Number(searchParams.get("south") ?? 47.01268365687996)
  const east = Number(searchParams.get("east") ?? 15.54668426513672)
  const north = Number(searchParams.get("north") ?? 47.12866607610054)

  const query = `
  (
    ${config.categories
      .flatMap((category) =>
        category.features.map(
          (feature) => `way[${feature.column}=${feature.value}];`
        )
      )
      .join("\n")}
  );
  out center qt;
`
  type Result = {
    center: { lat: number; lon: number }
    tags: Record<string, any>
  }
  const overpassResults = await queryOverpass<Result>(
    [
      [south, west],
      [north, east],
    ],
    query
  )

  const geojson = JSON.stringify({
    type: "FeatureCollection",
    crs: {
      type: "name",
      properties: {
        name: "EPSG:4326",
      },
    },
    features: config.categories.map((category) => ({
      type: "FeatureCollection",
      properties: {
        name: category.name,
        color: category.color,
        weight: category.weight,
      },
      features: category.features.map((feature) => ({
        type: "FeatureCollection",
        properties: {
          column: feature.column,
          value: feature.value,
          weight: feature.weight,
        },
        features: overpassResults
          .filter((result) => result.tags[feature.column] == feature.value)
          .map((result) => ({
            type: "Feature",
            properties: {
              name: result.tags.name,
            },
            geometry: {
              type: "Point",
              coordinates: [result.center.lon, result.center.lat],
            },
          })),
      })),
    })),
  })
  return new Response(geojson, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=graz.geojson",
    },
  })
}
