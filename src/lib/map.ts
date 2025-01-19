import L from "leaflet"

export const baseLayer = L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png?apiKey=1db73c1d-87b1-4581-b332-43563b7ab4bc",
  {
    className: "invert",
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap</a> contributors',
  }
)
