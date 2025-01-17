export async function queryNominatim(query: string): Promise<{
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
}> {
  const result = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
  ).then((data) => data.json())

  const [minLat, maxLat, minLon, maxLon] = result[0]!.boundingbox
  return {
    minLat: Number(minLat),
    minLon: Number(minLon),
    maxLat: Number(maxLat),
    maxLon: Number(maxLon),
  }
}

export async function queryOverpass<T>(query: string): Promise<T[]> {
  query = `[out:json][timeout:90];${query}`
  const result = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
  }).then((data) => data.json())

  console.log(`overpass >> ${query} >> ${JSON.stringify(result, null, 2)}`)

  return result.elements
}
