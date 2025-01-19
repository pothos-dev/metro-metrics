import L from "leaflet"

export async function queryNominatim(query: string): Promise<L.LatLngBounds> {
  const result = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
  ).then((data) => data.json())

  const [minLat, maxLat, minLon, maxLon] = result[0]!.boundingbox
  return L.latLngBounds([
    [Number(minLat), Number(minLon)],
    [Number(maxLat), Number(maxLon)],
  ])
}

export async function queryOverpass<T>(
  bbox: L.LatLngBounds,
  query: string
): Promise<T[]> {
  const bboxCoords = [
    bbox.getSouth(),
    bbox.getWest(),
    bbox.getNorth(),
    bbox.getEast(),
  ]

  query = `[out:json][timeout:90][bbox:${bboxCoords.join(",")}]; ${query}`

  const result = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
  }).then((data) => data.json())

  console.log(`overpass >> ${query} >> ${JSON.stringify(result, null, 2)}`)

  return result.elements
}
