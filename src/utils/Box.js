import { getRandomNumber } from './math'

class Box extends Path2D {
  constructor (x, y, w, h, stroke = 6, scale = 1) {
    super()
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.stroke = stroke
    this.scale = scale
    this._fill = '#fff'
    this._strokeFill = '#000'
    this.name = 'Box'
    this.randomNumber = getRandomNumber()
  }

  get id () {
    return `Box-${this.x}-${this.y}-${this.randomNumber}`
  }

  get withStroke () {
    return {
      x: this.x - this.stroke,
      y: this.y - this.stroke,
      w: this.w + 2 * this.stroke,
      h: this.h + 2 * this.stroke,
      rx: this.x + this.w + this.stroke,
      ry: this.y + this.h + this.stroke
    }
  }

  get scaled () {
    return {
      x: Math.round(this.x * this.scale),
      y: Math.round(this.y * this.scale),
      rx: Math.round((this.w + this.x) * this.scale),
      ry: Math.round((this.h + this.y) * this.scale)
    }
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
}

export default Box
