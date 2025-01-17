import { CoordinateConverter } from "$lib/coordinates"
import { queryNominatim } from "$lib/osm-api"
import L, { LatLng } from "leaflet"
import "leaflet/dist/leaflet.css"
import { range } from "lodash-es"

const apiKey = "1db73c1d-87b1-4581-b332-43563b7ab4bc"
const baseUrl =
  "https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png"
const attribution =
  '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap</a> contributors'

export class Map {
  map: L.Map

  constructor(id: string, lat: number, lon: number, zoom: number) {
    this.map = L.map(id)
    this.map.setView([lat, lon], zoom)
    this.map.addLayer(
      L.tileLayer(`${baseUrl}?apiKey=${apiKey}`, {
        className: "invert",
        maxZoom: 19,
        attribution,
      })
    )
  }

  async seek(query: string) {
    const { minLat, minLon, maxLat, maxLon } = await queryNominatim(query)
    this.map.fitBounds([
      [minLat, minLon],
      [maxLat, maxLon],
    ])
  }

  getBounds() {
    const bounds = this.map.getBounds()
    return {
      minLat: bounds.getSouth(),
      minLon: bounds.getWest(),
      maxLat: bounds.getNorth(),
      maxLon: bounds.getEast(),
    }
  }

  addPolygon(points: [number, number][]) {
    new L.Polygon(points).addTo(this.map)
  }
}
