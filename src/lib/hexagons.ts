import { range } from "lodash-es"

function generateHex(
  x: number,
  y: number,
  hexRadius: number
): [number, number][] {
  return range(6).map((i) => {
    const angle = (i / 6) * 2 * Math.PI
    return [x + hexRadius * Math.sin(angle), y + hexRadius * Math.cos(angle)]
  })
}

function qrToPixel(q: number, r: number, hexRadius: number) {
  const x =
    hexRadius * Math.sqrt(3) * q + ((hexRadius * Math.sqrt(3)) / 2) * (r % 2)
  const y = ((hexRadius * 3) / 2) * r
  return [x, y]
}

export function generateHexGrid(
  left: number,
  top: number,
  right: number,
  bottom: number,
  hexRadius: number
) {
  const dx = (Math.sqrt(3) / 2) * hexRadius
  const dy = 1.5 * hexRadius

  const cols = Math.floor((right - left) / dx)
  const rows = Math.floor((bottom - top) / dy)

  return range(cols).flatMap((q) =>
    range(rows).map((r) => {
      const [x, y] = qrToPixel(q, r, hexRadius)
      return generateHex(left + x, top + y, hexRadius)
    })
  )
}
