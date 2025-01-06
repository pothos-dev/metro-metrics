import { loadHexagons } from "$lib/db"
import { type Config } from "$lib/types"

export async function POST({ params, request }) {
  let t1 = new Date()
  const config: Config = await request.json()
  const hexagons = await loadHexagons(params.city, config)

  let t2 = new Date()

  const data = {
    hexagons,
    time: t2.getTime() - t1.getTime(),
  }

  return new Response(JSON.stringify(data))
}
