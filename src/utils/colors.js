const convertHexToRgb = (hex) => {
  const normal = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (normal) return normal.slice(1).map(e => parseInt(e, 16))

  const shorthand = hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
  if (shorthand) return shorthand.slice(1).map(e => 0x11 * parseInt(e, 16))

  return null
}

const convertRgbToHex = (color) => {
  const [red, green, blue] = color.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/).slice(1)
  const rgb = (red << 16) | (green << 8) | (blue << 0)

  return '#' + (0x1000000 + rgb).toString(16).slice(1)
}

export {
  convertHexToRgb,
  convertRgbToHex
}
