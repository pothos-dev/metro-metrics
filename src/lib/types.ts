export type Config = {
  categories: Category[]
}

export type Category = {
  name: string
  pois: POI[]

  enabled: boolean
  weight: number
}

export type POI = {
  enabled: boolean
  weight: number

  maxCount: number
  maxDistance: number

  column: string
  value: string

  includePolygons: boolean
  includePoints: boolean
  includeLines: boolean
}

export type GeometryType = "point" | "line" | "polygon"

export type TooltipCategory = {
  category: string
  totalWeight: number
  features: {
    column: string
    value: string
    weight: number
    count: number
  }[]
}
