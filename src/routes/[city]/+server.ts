import { loadHexagons } from "$lib/db"
import { type Config } from "$lib/types"

export async function POST({ params, request }) {
  const config: Config = await request.json()

  const { hexagons, elapsed, statement } = await loadHexagons(
    params.city,
    config
  )

  const data = {
    hexagons,
    elapsed,
    statement,
  }

  return new Response(JSON.stringify(data))
}
