import OpenSeadragon from 'openseadragon'

let drag = null

function drawRectangle (rectangle, viewer, callback, deleteCallback) {
  return new OpenSeadragon.MouseTracker({
    element: rectangle.element,
    pressHandler: (event) => {
      if (rectangle.element.dataset.tool === 'erasing') {
        return deleteCallback(rectangle)
      } else if (rectangle.element.dataset.tool === 'cursor') {
        drag = rectangle
      }
    },
    dragHandler: (event) => {
      if (!drag) {
        return
      }
      const windowCoords = new OpenSeadragon.Point(event.originalEvent.x, event.originalEvent.y)
      const viewportCoords = viewer.viewport.windowToViewportCoordinates(windowCoords)
      const overlay = viewer.getOverlayById(drag.element)
      overlay.update(viewportCoords, OpenSeadragon.Placement.CENTER)
      overlay.drawHTML(drag.element.parentNode, viewer.viewport)
      rectangle.location = overlay
    },
    releaseHandler: (event) => {
      try {
        callback(rectangle)
      } catch (e) {
        console.error(e)
      }
      drag = null
    }
  })
}

export default drawRectangle
