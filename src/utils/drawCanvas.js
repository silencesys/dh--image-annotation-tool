import OpenSeadragon from 'openseadragon'

let drag = null

function drawRectangle (canvas, callback) {
  return new OpenSeadragon.MouseTracker({
    element: canvas.element,
    pressHandler: (event) => {
      if (canvas.element.dataset.tool !== 'rectangleDrawing') {
        return
      }
      const overlayElement = document.createElement('div')
      overlayElement.style.background = canvas.element.dataset.fillStyle
      overlayElement.style.borderWidth = canvas.element.dataset.lineWidth
      overlayElement.style.borderStyle = 'solid'
      overlayElement.style.borderColor = canvas.element.dataset.strokeStyle
      overlayElement.className = 'openSeaDragon__Overlay'
      const viewportPos = canvas.viewport.pointFromPixel(event.position)
      canvas.addOverlay(overlayElement, new OpenSeadragon.Rect(viewportPos.x, viewportPos.y, 0, 0))

      drag = {
        overlayElement: overlayElement,
        startPos: viewportPos
      }
    },
    dragHandler: (event) => {
      if (!drag) {
        return
      }

      const viewportPos = canvas.viewport.pointFromPixel(event.position)
      const diffX = viewportPos.x - drag.startPos.x
      const diffY = viewportPos.y - drag.startPos.y

      const location = new OpenSeadragon.Rect(
        Math.min(drag.startPos.x, drag.startPos.x + diffX),
        Math.min(drag.startPos.y, drag.startPos.y + diffY),
        Math.abs(diffX),
        Math.abs(diffY)
      )

      drag.location = location

      canvas.updateOverlay(drag.overlayElement, location)
    },
    releaseHandler: (event) => {
      if (drag && drag.location) {
        try {
          callback(drag)
        } catch (e) {
          console.error(e)
        }
      }
      drag = null
    }
  })
}

export default drawRectangle
