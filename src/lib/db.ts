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

  type ColumnName = string
  type ColumnValue = string
  const usedColumns = new Map<GeometryType, Map<ColumnName, Set<ColumnValue>>>()

  for (const category of config.categories) {
    if (!category.enabled) continue

    const categoryWeight =
      category.weight *
      category.pois.reduce(
        (acc, poi) => acc + (poi.enabled ? poi.weight : 0),
        0
      )

    for (const poi of category.pois) {
      if (!poi.enabled) continue

      if (poi.weight * categoryWeight > 0) {
        totalWeight += poi.weight * categoryWeight
      }

      maxRadius = Math.max(maxRadius, poi.maxDistance)

      let geometryTypes = compact([
        poi.includePoints && "point",
        poi.includeLines && "line",
        poi.includePolygons && "polygon",
      ])

      const feature: Features = {
        name: [category.name, poi.column, poi.value]
          .join("__")
          .replaceAll(" ", "_")
          .toLowerCase(),
        weight: poi.weight * categoryWeight,
        maxCount: poi.maxCount,
        joinTables: [],
      }
      features.push(feature)

      for (const geometryType of geometryTypes) {
        if (!usedColumns.has(geometryType)) {
          usedColumns.set(geometryType, new Map())
        }
        const columnMap = usedColumns.get(geometryType)!
        if (!columnMap.has(poi.column)) {
          columnMap.set(poi.column, new Set())
        }
        columnMap.get(poi.column)!.add(poi.value)

        const tableName = [category.name, poi.column, poi.value, geometryType]
          .join("__")
          .replaceAll(" ", "_")
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
    const columnMap = usedColumns.get(geometryType)!
    const columnNames = Array.from(columnMap.keys())

    ctes.unshift({
      tableName: geometryType,
      query: `
        select
          feature.way as geom,
          ${columnNames.join(",")}
        from planet_osm_${geometryType} feature, hexagon_bbox bbox
        where st_within(feature.way, bbox.geom)
        and (
          ${columnNames
            .map((columnName) => {
              const values = Array.from(columnMap.get(columnName)!)
              return `feature.${columnName} in (${values.map((v) => `'${v}'`).join(",")})`
            })
            .join(" or ")}
        )
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

  let hexagons: {
    id: string
    geom: string
    [key: string]: string
  }[] = []
  let error = ""

  const t1 = performance.now()
  try {
    console.log("Running query...\n", statement)

    hexagons = await sql.unsafe(statement)
  } catch (e: any) {
    error = `Error: ${e.toString()}`
  }
  const t2 = performance.now()
  const elapsed = t2 - t1
  console.log(`Elapsed: ${elapsed}ms`)

  let hexagonsMapped = hexagons.map((hexagon) => {
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
  })

  const minPercent = Math.min(...hexagonsMapped.map((hex) => hex.percent))
  const maxPercent = Math.max(...hexagonsMapped.map((hex) => hex.percent))

  return {
    statement,
    error,
    elapsed,
    hexagons: hexagonsMapped,
    minPercent,
    maxPercent,
  }
}
