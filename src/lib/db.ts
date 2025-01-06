import { env } from "$env/dynamic/private"
import type { Config } from "$lib/types"
import postgres from "postgres"

export const sql = postgres(env.DATABASE_URL)

export async function loadCity(name: string) {
  const rows = await sql<
    {
      geom: string
    }[]
  >`
    select
      way as geom
    from planet_osm_polygon
    where name = ${name}
      and boundary = 'administrative'
    limit 1
  `

  return rows[0]
}

export async function loadHexagons(name: string, config: Config) {
  let totalWeight = 0
  let maxRadius = 0

  let pointColumns = new Set<string>()
  let lineColumns = new Set<string>()
  let polygonColumns = new Set<string>()

  let ctes = [] as {
    tableName: string
    query: string
    radius: number
    weight: number
  }[]

  for (const category of config.categories) {
    if (!category.enabled) continue
    for (const poi of category.pois) {
      if (!poi.enabled) continue

      totalWeight += poi.weight * category.weight
      maxRadius = Math.max(maxRadius, poi.maxDistance)

      let geometryTypes = []

      if (poi.includePoints) {
        pointColumns.add(poi.column)
        geometryTypes.push("points")
      }
      if (poi.includeLines) {
        lineColumns.add(poi.column)
        geometryTypes.push("lines")
      }
      if (poi.includePolygons) {
        polygonColumns.add(poi.column)
        geometryTypes.push("polygons")
      }

      for (const geometryType of geometryTypes) {
        let tableName =
          `${category.name}__${poi.column}__${poi.value}__${geometryType}`.toLowerCase()
        ctes.push({
          tableName,
          radius: poi.maxDistance,
          weight: poi.weight * category.weight,
          query: `
      ${tableName} as (
        select geom
        from ${geometryType}
        where ${poi.column} = '${poi.value}'
      )`,
        })
      }
    }
  }

  const statement = `
    with
      hexagons as (
        select
          id,
          geom,
          st_centroid(geom) as centroid
        from hexagons
        where name = '${name}'
      ),

      hexagon_bbox as (
        select
          st_envelope(geom) as geom
        from hexagons
      ),

      ${
        pointColumns.size > 0
          ? `
      points as (
        select
          p.way as geom,
          ${Array.from(pointColumns)
            .map((key) => `p.${key}`)
            .join(",")}
        from planet_osm_point p, hexagon_bbox bbox
          where st_within(p.way, bbox.geom)
        ),
      `
          : ""
      }

      ${
        polygonColumns.size > 0
          ? ` 
      polygons as (
        select
          p.way as geom,
          ${Array.from(polygonColumns)
            .map((key) => `p.${key}`)
            .join(",")}
        from planet_osm_polygon p, hexagon_bbox bbox
          where st_within(p.way, bbox.geom)
        ),
      `
          : ""
      }

      ${
        lineColumns.size > 0
          ? `
      lines as (
        select
          l.way as geom,
          ${Array.from(lineColumns)
            .map((key) => `l.${key}`)
            .join(",")}
        from planet_osm_line l, hexagon_bbox bbox
          where st_within(l.way, bbox.geom)
        ),
      `
          : ""
      }

      ${ctes.map((cte) => cte.query).join(",\n")}

    select
      h.id,
      h.geom,
      ${ctes
        .map((cte) => `count(${cte.tableName}.*) as ${cte.tableName}`)
        .join(",")}
      
    from hexagons h
    ${ctes
      .map(
        (cte) =>
          `left join ${cte.tableName} on st_dwithin(h.centroid, ${cte.tableName}.geom, ${cte.radius})`
      )
      .join("\n")}
    group by h.id, h.geom
  `
  console.log(statement)

  const hexagons: {
    id: string
    geom: string
    [key: string]: string
  }[] = await sql.unsafe(statement)

  return hexagons.map((hexagon) => {
    let weight = 0
    for (const cte of ctes) {
      weight += Number(hexagon[cte.tableName]) * cte.weight
    }

    return {
      ...hexagon,
      percent: (weight / totalWeight) * 100,
    }
  })
}
