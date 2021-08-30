import OpenSeadragon from 'openseadragon'

let drag = null

function drawRectangle (el, viewer) {
  return new OpenSeadragon.MouseTracker({
    element: el.overlayElement,
    pressHandler: (event) => {
      if (el.overlayElement.dataset.tool === 'erasing') {
        return viewer.removeOverlay(el.overlayElement)
      } else if (el.overlayElement.dataset.tool === 'cursor') {
        drag = el
      }
    },
    dragHandler: (event) => {
      if (!drag) {
        return
      }
      const windowCoords = new OpenSeadragon.Point(event.originalEvent.x, event.originalEvent.y)
      const viewportCoords = viewer.viewport.windowToViewportCoordinates(windowCoords)
      const overlay = viewer.getOverlayById(drag.overlayElement)
      overlay.update(viewportCoords, OpenSeadragon.Placement.CENTER)
      overlay.drawHTML(drag.overlayElement.parentNode, viewer.viewport)
      drag.location = overlay
    },
    releaseHandler: (event) => {
      drag = null
    }
  })
}

export default drawRectangle
