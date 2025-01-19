export type Category = {
  name: string
  heatmapRadius: number
  color: string
  weight: number
  features: Feature[]
}

export type Feature = {
  weight: number
  column: string
  value: string
  maxCount: number
  maxDistance: number
}

export const config = {
  categories: [
    {
      name: "Basic Services",
      color: "#cc0000",
      heatmapRadius: 100,
      weight: 1,
      features: [
        {
          weight: 1,
          column: "amenity",
          value: "doctors",
          maxCount: 5,
          maxDistance: 750,
        },
        {
          weight: 2,
          column: "amenity",
          value: "health_centre",
          maxCount: 1,
          maxDistance: 5000,
        },
        {
          weight: 2,
          column: "amenity",
          value: "hospital",
          maxCount: 1,
          maxDistance: 2000,
        },
        {
          weight: 1,
          column: "amenity",
          value: "pharmacy",
          maxCount: 1,
          maxDistance: 500,
        },
        {
          weight: 2,
          column: "building",
          value: "shopping_center",
          maxCount: 1,
          maxDistance: 5000,
        },
        {
          weight: 1,
          column: "shop",
          value: "supermarket",
          maxCount: 3,
          maxDistance: 1000,
        },
      ],
    },
    {
      name: "Recreation",
      color: "#006400",
      heatmapRadius: 100,
      features: [
        {
          weight: 1,
          column: "leisure",
          value: "park",
          maxCount: 2,
          maxDistance: 750,
        },
        {
          weight: 2,
          column: "landuse",
          value: "forest",
          maxCount: 1,
          maxDistance: 100,
        },
        {
          weight: 1,
          column: "leisure",
          value: "playground",
          maxCount: 1,
          maxDistance: 100,
        },
        {
          weight: 1,
          column: "leisure",
          value: "sports_centre",
          maxCount: 1,
          maxDistance: 500,
        },
      ],
      weight: 1,
    },
    {
      name: "Mobility",
      color: "#4B0082",
      heatmapRadius: 10,
      features: [
        {
          weight: 2,
          column: "highway",
          value: "bus_stop",
          maxCount: 4,
          maxDistance: 200,
        },
        {
          weight: 1,
          column: "highway",
          value: "cycleway",
          maxCount: 10,
          maxDistance: 500,
        },
        {
          weight: 1,
          column: "building",
          value: "train_station",
          maxCount: 1,
          maxDistance: 500,
        },
      ],
      weight: 1,
    },
    {
      name: "Culture and Entertainment",
      color: "#000080",
      heatmapRadius: 100,
      features: [
        {
          weight: 1,
          column: "amenity",
          value: "cinema",
          maxCount: 1,
          maxDistance: 3000,
        },
        {
          weight: 1,
          column: "amenity",
          value: "restaurant",
          maxCount: 5,
          maxDistance: 500,
        },
        {
          weight: 1,
          column: "amenity",
          value: "cafe",
          maxCount: 5,
          maxDistance: 500,
        },
        {
          weight: 1,
          column: "amenity",
          value: "theatre",
          maxCount: 1,
          maxDistance: 3000,
        },
        {
          weight: 1,
          column: "tourism",
          value: "museum",
          maxCount: 2,
          maxDistance: 3000,
        },
        {
          weight: 1,
          column: "tourism",
          value: "artwork",
          maxCount: 2,
          maxDistance: 1000,
        },
      ],
      weight: 1,
    },
    {
      name: "Education",
      color: "#806000",
      heatmapRadius: 100,
      features: [
        {
          weight: 1,
          column: "amenity",
          value: "kindergarten",
          maxCount: 2,
          maxDistance: 750,
        },
        {
          weight: 1,
          column: "amenity",
          value: "school",
          maxCount: 2,
          maxDistance: 1000,
        },
        {
          weight: 1,
          column: "amenity",
          value: "college",
          maxCount: 2,
          maxDistance: 1500,
        },
        {
          weight: 1,
          column: "amenity",
          value: "university",
          maxCount: 1,
          maxDistance: 3000,
        },
      ],
      weight: 1,
    },
    {
      name: "Noise",
      color: "#000000",
      heatmapRadius: 10,
      features: [
        {
          weight: 3,
          column: "railway",
          value: "rail",
          maxCount: 1,
          maxDistance: 200,
        },
        {
          weight: 1,
          column: "railway",
          value: "tram",
          maxCount: 1,
          maxDistance: 50,
        },
        {
          weight: 3,
          column: "highway",
          value: "motorway",
          maxCount: 1,
          maxDistance: 500,
        },
        {
          weight: 1,
          column: "highway",
          value: "primary",
          maxCount: 1,
          maxDistance: 50,
        },
        {
          weight: 0.5,
          column: "highway",
          value: "secondary",
          maxCount: 1,
          maxDistance: 50,
        },
      ],
      weight: -1,
    },
  ],
}
