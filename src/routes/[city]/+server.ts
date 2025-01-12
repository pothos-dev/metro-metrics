import { loadHexagons } from "$lib/db"
import { type Config } from "$lib/types"

export async function POST({ params, request }) {
  const config: Config = await request.json()
  const data = await loadHexagons(params.city, config)
  return new Response(JSON.stringify(data))
}
