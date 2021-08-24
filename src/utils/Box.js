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
    this._centre = { x: 0, y: 0 }
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

  get currentCentre () {
    return this._centre
  }

  set currentCentre (centre) {
    this._centre = centre
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

  // Above needs refactor

  draw (context, self = true, callback = null) {
    context.beginPath()
    context.lineWidth = this.stroke
    context.strokeStyle = this.strokeFill
    context.fillStyle = this.fill
    if (self) {
      this.rect(this.x, this.y, this.w, this.h)
      context.stroke(this)
      context.fill(this)
    } else {
      context.rect(this.x, this.y, this.w, this.h)
      context.stroke()
      context.fill()
    }

    if (typeof callback === 'function') {
      callback(this.id)
    }
  }
}

export default Box
