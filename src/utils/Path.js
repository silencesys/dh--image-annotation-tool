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

  get points () {
    return this._points
  }

  get pointsScaled () {
    return this._points.map(point => {
      return `${Math.round(point.x / this.scale)},${Math.round(point.y / this.scale)}`
    })
  }
}

export default Path
