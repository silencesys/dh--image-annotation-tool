import { getRandomNumber } from './math'

class Polygon extends Path2D {
  constructor (
    points,
    scale,
    { strokeStyle = 'rgba(173, 90, 46)', fillStyle = 'rgba(173, 90, 46, 0.5)', lineWidth = 3 }
  ) {
    super()
    this.strokeStyle = strokeStyle
    this.fillStyle = fillStyle
    this.lineWidth = lineWidth
    this.scale = scale
    this.points = points

    // Semi-private properties
    this._name = 'Polygon'
    this._randomNumber = getRandomNumber()
    this._centre = { x: 0, y: 0 }
    this._originalApparance = {
      fillStyle: fillStyle,
      strokeStyle: strokeStyle,
      lineWidth: lineWidth
    }
  }

  get apparance () {
    return this._originalApparance
  }

  copyApparance (apparance) {
    this._originalApparance.strokeStyle = apparance.strokeStyle
    this._originalApparance.fillStyle = apparance.fillStyle
    this._originalApparance.lineWidth = apparance.lineWidth
  }

  get id () {
    return `Polygon-${this.points.length}-${this._randomNumber}`
  }

  get name () {
    return this._name
  }

  get currentCentre () {
    return this._centre
  }

  set currentCentre (centre) {
    this._centre = centre
  }

  get scaledPoints () {
    return this.points.map(point => {
      return { x: point.x / this.scale, y: point.y / this.scale }
    })
  }

  get scaledPointsAsString () {
    return this.points.map(point => {
      return `${Math.round(point.x / this.scale)},${Math.round(point.y / this.scale)}`
    }).join(' ')
  }

  draw (context, self = true, callback = null) {
    context.beginPath()
    context.lineWidth = this.lineWidth
    context.fillStyle = this.fillStyle
    context.strokeStyle = this.strokeStyle

    if (self) {
      this.scaledPoints.forEach((coords, index) => {
        if (index === 0) {
          this.moveTo(coords.x, coords.y)
        } else {
          this.lineTo(coords.x, coords.y)
        }
      })
      this.closePath()
      context.stroke(this)
      context.fill(this)
    } else {
      this.scaledPoints.forEach((coords, index) => {
        if (index === 0) {
          context.moveTo(coords.x, coords.y)
        } else {
          context.lineTo(coords.x, coords.y)
        }
      })
      context.closePath()
      context.stroke()
      context.fill()
    }

    if (typeof callback === 'function') {
      callback(this.id)
    }
  }

  static drawPoint (context, { x = 0, y = 0, radius = 4, fillStyle, strokeStyle, lineWidth }, scale) {
    context.beginPath()
    context.lineWidth = lineWidth
    context.strokeStyle = strokeStyle
    context.fillStyle = fillStyle
    context.arc(x / scale, y / scale, radius / scale, 0, 2 * Math.PI)
    context.stroke()
    context.fill()
  }

  resetColors () {
    this.strokeStyle = this._originalApparance.strokeStyle
    this.fillStyle = this._originalApparance.fillStyle
  }
}

export default Polygon
