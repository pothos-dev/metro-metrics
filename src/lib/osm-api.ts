export async function queryNominatim(
  query: string
): Promise<[[number, number], [number, number]]> {
  const result = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
  ).then((data) => data.json())

  const [minLat, maxLat, minLon, maxLon] = result[0]!.boundingbox
  return [
    [minLat, minLon],
    [maxLat, maxLon],
  ]
}

export async function queryOverpass<T>(
  bbox: [[number, number], [number, number]],
  query: string
): Promise<T[]> {
  const bboxCoords = [bbox[0][0], bbox[0][1], bbox[1][0], bbox[1][1]]
  query = `[out:json][timeout:90][bbox:${bboxCoords.join(",")}]; ${query}`

  const result = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
  }).then((data) => data.json())

  return result.elements
}
