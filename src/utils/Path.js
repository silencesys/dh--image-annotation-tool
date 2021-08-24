import { getRandomNumber } from './math'

class Path extends Path2D {
  constructor (stroke = 6, scale = 1) {
    super()
    this.stroke = stroke
    this.scale = scale
    this._fill = '#fff'
    this._strokeFill = '#000'
    this._points = []
    this.name = 'Path'
    this.randomNumber = getRandomNumber()
    this._centre = { x: 0, y: 0 }
  }

  get id () {
    return `Path-${this._points.length}-${this.randomNumber}`
  }

  set fill (fill) {
    this._fill = fill
  }

  get fill () {
    return this._fill
  }

  set strokeFill (fill) {
    this._strokeFill = fill
  }

  get strokeFill () {
    return this._strokeFill
  }

  set points (points) {
    this._points = points
  }

  get rawPoints () {
    return this._points
  }

  get currentCentre () {
    return this._centre
  }

  set currentCentre (centre) {
    this._centre = centre
  }

  get points () {
    return this._points.map(point => {
      return { x: point.x / this.scale, y: point.y / this.scale }
    })
  }

  get pointsScaled () {
    return this._points.map(point => {
      return `${Math.round(point.x / this.scale)},${Math.round(point.y / this.scale)}`
    })
  }

  // Above needs refactor

  draw (context, self = true, callback = null) {
    context.beginPath()
    context.lineWidth = this.stroke
    context.fillStyle = this.fill
    context.strokeStyle = this.strokeFill

    if (self) {
      this.points.forEach((coords, index) => {
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
      this.points.forEach((coords, index) => {
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
}

export default Path
