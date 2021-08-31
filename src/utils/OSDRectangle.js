import { getRandomNumber } from './math'

class OSDRectangle {
  constructor (OSDRectangle, element) {
    this._rectangle = OSDRectangle
    this._scaledRectangle = {}
    this._element = element
    this._name = 'Rectangle'
    this._randomNumber = getRandomNumber()
    this._overlayHandler = null
  }

  get name () {
    return this._name
  }

  get id () {
    return `Rectangle-${this._randomNumber}`
  }

  set overlay (overlay) {
    this._rectangle = overlay
  }

  get overlay () {
    return this._rectangle
  }

  get element () {
    return this._element
  }

  set overlayHandler (func) {
    this._overlayHandler = func
  }

  get overlayHandler () {
    return this._overlayHandler
  }

  get scaled () {
    return {
      x: Math.round(this._scaledRectangle.x),
      y: Math.round(this._scaledRectangle.y),
      rx: Math.round(this._scaledRectangle.x + this._scaledRectangle.width),
      ry: Math.round(this._scaledRectangle.y + this._scaledRectangle.height),
      width: Math.round(this._scaledRectangle.width),
      height: Math.round(this._scaledRectangle.height)
    }
  }

  scaleWith (func) {
    this._scaledRectangle = func(this._rectangle)
    return this._scaledRectangle
  }
}

export default OSDRectangle
