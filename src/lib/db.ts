import { env } from "$env/dynamic/private"
import type { Config, GeometryType, TooltipCategory } from "$lib/types"
import { compact, uniq } from "lodash-es"
import postgres from "postgres"
import { format } from "sql-formatter"
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

export async function loadHexagons(cityName: string, config: Config) {
  type CTE = { tableName: string; query: string }
  type Features = {
    name: string
    weight: number
    maxCount: number
    joinTables: string[]
  }

  const ctes: CTE[] = []
  const features: Features[] = []

  let totalWeight = 0
  let maxRadius = 0
  const usedColumns = new Map<GeometryType, Set<string>>()

  for (const category of config.categories) {
    for (const poi of category.pois) {
      if (!category.enabled || !poi.enabled) continue

      totalWeight += poi.weight * category.weight
      maxRadius = Math.max(maxRadius, poi.maxDistance)

      let geometryTypes = compact([
        poi.includePoints && "point",
        poi.includeLines && "line",
        poi.includePolygons && "polygon",
      ])

      const feature: Features = {
        name: [category.name, poi.column, poi.value].join("__").toLowerCase(),
        weight: poi.weight * category.weight,
        maxCount: poi.maxCount,
        joinTables: [],
      }
      features.push(feature)

      for (const geometryType of geometryTypes) {
        if (!usedColumns.has(geometryType)) {
          usedColumns.set(geometryType, new Set())
        }
        usedColumns.get(geometryType)!.add(poi.column)

        const tableName = [category.name, poi.column, poi.value, geometryType]
          .join("__")
          .toLowerCase()

        const query = `
          select
            hex.id,
            count(feature.*) as count
          from
            hexagons hex,
            ${geometryType} feature
          where
            st_dwithin(hex.centroid, feature.geom, ${poi.maxDistance + 500})
            and feature.${poi.column} = '${poi.value}'
          group by hex.id
        `

        ctes.push({ tableName, query })
        feature.joinTables.push(tableName)
      }
    }
  }

  // Add the required CTEs for the geometry types that we used
  for (const geometryType of usedColumns.keys()) {
    ctes.unshift({
      tableName: geometryType,
      query: `
        select
          feature.way as geom,
          ${Array.from(usedColumns.get(geometryType)!).join(",")}
        from planet_osm_${geometryType} feature, hexagon_bbox bbox
        where st_within(feature.way, bbox.geom)
      `,
    })
  }

  // Add the base CTEs that we always need
  ctes.unshift(
    {
      tableName: "hexagons",
      query: `
      select
        id,
        geom,
        st_centroid(geom) as centroid
      from hexagons
      where name = '${cityName}'
    `,
    },
    {
      tableName: "hexagon_bbox",
      query: `
      select
        st_buffer(st_envelope(st_union(geom)), ${maxRadius}) as geom
      from hexagons
    `,
    }
  )

  const statement = format(
    `
    with
      ${ctes.map((cte) => `${cte.tableName} as (${cte.query})`).join(",\n")}

    select
      hex.id,
      hex.geom,
      ${features
        .map((feature) => {
          const q = feature.joinTables
            .map((t) => `coalesce(${t}.count, 0)`)
            .join(" + ")
          return `least(${q}, ${feature.maxCount}) as ${feature.name}`
        })
        .join(",\n")}
    from hexagons hex
    ${features
      .flatMap((feature) => feature.joinTables)
      .map((t) => `left join ${t} on ${t}.id = hex.id`)
      .join("\n")}
  `,
    { language: "postgresql" }
  )

  const t1 = performance.now()
  const hexagons: {
    id: string
    geom: string
    [key: string]: string
  }[] = await sql.unsafe(statement)
  const t2 = performance.now()
  const elapsed = t2 - t1

  console.log("--------------------------------")
  console.log(statement)
  console.log("--------------------------------")
  console.log(`Elapsed: ${elapsed}ms`)

  return {
    statement,
    elapsed,
    hexagons: hexagons.map((hexagon) => {
      let hexWeight = 0
      let hexCategories = {} as Record<string, TooltipCategory>

      for (const feature of features) {
        const count = Number(hexagon[feature.name] || "0")
        const weight = (count / feature.maxCount) * feature.weight
        hexWeight += weight

        const [category, column, value] = feature.name.split("__")
        hexCategories[category] ??= { category, totalWeight: 0, features: [] }
        hexCategories[category].totalWeight += weight
        hexCategories[category].features.push({
          column,
          value,
          weight,
          count,
        })
      }

      return {
        id: hexagon.id,
        geom: hexagon.geom,
        categories: Object.values(hexCategories),
        percent: Math.round((hexWeight / totalWeight) * 100),
      }
    }),
  }
}
