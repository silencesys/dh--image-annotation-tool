import { getRandomNumber } from './math'

class Rectangle extends Path2D {
  constructor (
    { x, y, width, height },
    scale = 1,
    { strokeStyle = 'rgba(173, 90, 46)', fillStyle = 'rgba(173, 90, 46, 0.5)', lineWidth = 3 }
  ) {
    super()
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.strokeStyle = strokeStyle
    this.fillStyle = fillStyle
    this.lineWidth = lineWidth
    this.scale = scale

    // Semi-private properties.
    this._name = 'Rectangle'
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
    return `Rectangle-${this.x}-${this.y}-${this._randomNumber}`
  }

  get scaled () {
    return {
      x: Math.round(this.x / this.scale),
      y: Math.round(this.y / this.scale),
      rx: Math.round((this.width + this.x) / this.scale),
      ry: Math.round((this.height + this.y) / this.scale),
      width: Math.round(this.width / this.scale),
      height: Math.round(this.height / this.scale)
    }
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

  draw (context, self = true, callback = null) {
    context.beginPath()
    context.lineWidth = this.lineWidth
    context.strokeStyle = this.strokeStyle
    context.fillStyle = this.fillStyle
    if (self) {
      this.rect(this.scaled.x, this.scaled.y, this.scaled.width, this.scaled.height)
      context.stroke(this)
      context.fill(this)
    } else {
      context.rect(this.scaled.x, this.scaled.y, this.scaled.width, this.scaled.height)
      context.stroke()
      context.fill()
    }

    if (typeof callback === 'function') {
      callback(this.id)
    }
  }

  static drawTemporary (
    context,
    { x = 0, y = 0, width = 100, height = 100, strokeStyle, fillStyle, lineWidth },
    scale = 1
  ) {
    context.beginPath()
    context.lineWidth = lineWidth
    context.strokeStyle = strokeStyle
    context.fillStyle = fillStyle
    context.rect(x / scale, y / scale, width / scale, height / scale)
    context.stroke()
    context.fill()
  }

  resetColors () {
    this.strokeStyle = this._originalApparance.strokeStyle
    this.fillStyle = this._originalApparance.fillStyle
  }
}

export default Rectangle
