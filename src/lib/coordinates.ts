import proj4 from "proj4"

export class CoordinateConverter {
  private utm: string
  private zone: number

  constructor(lat: number, lon: number) {
    // Calculate UTM zone
    this.zone = Math.floor((lon + 180) / 6) + 1

    // Define projections
    this.utm = `+proj=utm +zone=${this.zone} ${lat >= 0 ? "+north" : "+south"} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`

    // Register the conversion
    proj4.defs("WGS84", "+proj=longlat +datum=WGS84 +no_defs")
    proj4.defs("UTM", this.utm)
  }

  /**
   * Convert WGS84 (lat/lon) to UTM coordinates
   * @returns [easting, northing] in meters
   */
  toUTM(lat: number, lon: number): [number, number] {
    const [easting, northing] = proj4("WGS84", "UTM", [lon, lat])
    return [easting, northing]
  }

  /**
   * Convert UTM coordinates to WGS84 (lat/lon)
   * @returns [latitude, longitude] in degrees
   */
  toLatLon(easting: number, northing: number): [number, number] {
    const [lon, lat] = proj4("UTM", "WGS84", [easting, northing])
    return [lat, lon]
  }

  /**
   * Get the UTM zone information
   */
  getZoneInfo(): { zone: number; hemisphere: string } {
    return {
      zone: this.zone,
      hemisphere: this.utm.includes("+north") ? "N" : "S",
    }
  }
}
