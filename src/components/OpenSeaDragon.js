import OpenSeaDragon from 'openseadragon'
import { useEffect, useRef, useState, useMemo } from 'react'
import drawRectangle from '../utils/drawCanvas'
import overlayHandler from '../utils/handleOverlay'
import OSDRectangle from '../utils/OSDRectangle'

const OpenSeaDragonCanvas = ({
  currentAction,
  objectApparance = { fillStyle: 'red' },
  setObjects,
  backgroundSettings,
  setBackgroundSettings
}) => {
  const [viewer, setViewer] = useState(null)
  const wrapper = useRef(null)
  const cursorMap = useMemo(() => ({
    zoom: 'zoom-in',
    zoomAlt: 'zoom-out',
    hand: 'grab',
    handAlt: 'grabbing',
    pathDrawing: 'crosshair',
    rectangleDrawing: 'crosshair',
    erasing: 'default',
    cursor: 'default',
    transformation: 'default'
  }), [])

  /**
   * Initialize OpenSeadragon and canvas element.
   */
  useEffect(() => {
    /**
     * Destroy any surviving viewer instance and initialize new one.
     */
    const initOpenseadragon = () => {
      viewer && viewer.destroy()
      setViewer(
        OpenSeaDragon({
          id: 'openSeaDragonCanvas',
          tileSources: backgroundSettings.url,
          animationTime: 0.5,
          showNavigator: false,
          showNavigationControl: false
        })
      )
    }
    if (!viewer) {
      // Init viewer only when there is no active instance.
      initOpenseadragon()
    }

    return () => {
      viewer && viewer.destroy()
    }
  }, [backgroundSettings.url, viewer])

  /**
   * Update state of canvas - cursor and OpenSeadragon manipulation.
   */
  useEffect(() => {
    /**
     * Enable canvas panning.
     * @param {Bool} state - whether should be panning active.
    */
    const enablePan = (state) => {
      viewer.panHorizontal = state
      viewer.panVertical = state
    }
    /**
     * Enable canvas zooming.
     * @param {Bool} state - whether should be zoom active.
    */
    const enableZoom = (state) => {
      if (!state) {
        // Lock canvas on current zoom level.
        const currentScale = viewer.viewport.getZoom(true)
        viewer.viewport.maxZoomLevel = currentScale
        viewer.viewport.minZoomLevel = currentScale
        viewer.viewport.defaultZoomLevel = currentScale
        viewer.viewport.applyConstraints(true)
      } else {
        // Reset canvas to default zoom level.
        viewer.viewport.maxZoomLevel = 10
        viewer.viewport.minZoomLevel = 0.5
        viewer.zoomPerClick = 1.25
        // Make sure that scroll does not zoom.
        viewer.zoomPerScroll = 1
      }
    }
    /**
     * Enable mouse navigation on canvas.
     * @param {Bool} state - whether should be mouse enabled.
    */
    const enableMouseNav = (state) => {
      try {
        viewer.setMouseNavEnabled(state)
      } catch (e) {
        // Fail silently
      }
    }
    // Set cursor based on tool.
    wrapper.current.style.cursor = cursorMap[currentAction.toolName]
    document.addEventListener('keydown', ({ ctrlKey }) => {
      // Some tools have alternative cursors when pressed modifier key.
      if (ctrlKey) {
        try {
          wrapper.current.style.cursor =
            cursorMap[`${currentAction.toolName}Alt`] ||
            cursorMap[currentAction.toolName]
        } catch (e) {
          // Silent catch.
        }
      }
    })
    document.addEventListener('keyup', () => {
      // Reset cursor to default state.
      try {
        wrapper.current.style.cursor = cursorMap[currentAction.toolName]
      } catch (e) {
        // Silent catch.
      }
    })

    // Handle canvas state based on selected tool.
    switch (currentAction.toolName) {
      case 'rectangleDrawing':
        enableMouseNav(false)
        break
      case 'hand':
        if (viewer) {
          enablePan(true)
          enableZoom(false)
          enableMouseNav(true)
        }
        break
      case 'zoom':
        enableZoom(true)
        enablePan(false)
        enableMouseNav(true)
        break
      case 'erasing':
        enablePan(false)
        enableZoom(false)
        enableMouseNav(false)
        break
      case 'cursor':
        enablePan(false)
        enableZoom(false)
        enableMouseNav(false)
        break
      default:
        enablePan(false)
        enableZoom(false)
        enableMouseNav(false)
        // do nothing
    }

    return () => {
      document.removeEventListener('keydown', () => {})
      document.removeEventListener('keyup', () => {})
    }
  }, [currentAction, cursorMap, viewer])

  /**
   * Handle drawn object updates.
   */
  useEffect(() => {
    /**
     * Update stored object with new coords.
     * @param {Object} osdRectangle
     */
    const updateObjects = (osdRectangle) => {
      osdRectangle.overlay = osdRectangle.location.getBounds(viewer.viewport)
      osdRectangle.scaleWith(viewer.viewport.viewportToImageRectangle.bind(viewer.viewport))
      setObjects(objects => {
        objects.map(object => {
          if (object.id === osdRectangle.id) {
            object = osdRectangle
          }
          return object
        })
        return [...objects]
      })
    }
    /**
   * Remove object from the canvas.
   * @param {Object} object - The object to remove.
   * @returns {void}
   */
    const deleteObject = (osdRectangle) => {
      if (osdRectangle) {
        setObjects(state => state.filter(obj => obj.id !== osdRectangle.id))
        viewer.removeOverlay(osdRectangle.element)
      }
    }

    setObjects(objects => {
      objects.map(el => {
        el.element.dataset.tool = currentAction.toolName
        if (['erasing', 'cursor'].includes(currentAction.toolName)) {
          // Assign objects action based on tool.
          el.overlayHandler = overlayHandler(el, viewer, updateObjects, deleteObject)
        } else {
          if (el.overlayHandler && typeof el.overlayHandler.destroy === 'function') {
            try {
              // Try to remove assignment.
              el.overlayHandler.destroy()
            } catch (e) {
              // fail silently
            }
          }
        }
        return el
      })
      return [...objects]
    })
  }, [currentAction, viewer, setObjects])

  /**
   * Handle canvas state.
   */
  useEffect(() => {
    /**
     * Store information about newly reated rectangle object.
     * @param {Object} rectangle
     */
    const createOSDRectangle = (rectangle) => {
      const osdRectangle = new OSDRectangle(rectangle.location, rectangle.overlayElement)
      osdRectangle.scaleWith(viewer.viewport.viewportToImageRectangle.bind(viewer.viewport))
      setObjects(objects => [...objects, osdRectangle])
    }
    /**
     * Register events that should be added to canvas when image is rendered.
     */
    const registerEventsOnCanvasOpen = () => {
      const tiledImage = viewer.world.getItemAt(0).getContentSize()
      setBackgroundSettings(state => ({ ...state, lrx: tiledImage.x, lry: tiledImage.y }))
      drawRectangle(viewer, createOSDRectangle)
    }

    if (viewer) {
      viewer.addHandler('open', registerEventsOnCanvasOpen)

      if (viewer.element) {
        // Add fill and stroke color as a line width to the data of canvas
        // element as I was unable to propagate updated values anywhere else
        // in the canvas code.
        viewer.element.dataset.fillStyle = objectApparance.fillStyle
        viewer.element.dataset.strokeStyle = objectApparance.strokeStyle
        viewer.element.dataset.lineWidth = objectApparance.lineWidth
        viewer.element.dataset.tool = currentAction.toolName
      }

      // Register events that should be modified based on tool and canvas state.
      viewer.addHandler('canvas-press', (e) => {
        const { originalEvent: { ctrlKey, buttons } } = e
        switch (currentAction.toolName) {
          case 'zoom':
            if (ctrlKey || buttons === 2) {
              viewer.zoomPerClick = 0.75
              wrapper.current.style.cursor = cursorMap.zoomAlt
            } else {
              viewer.zoomPerClick = 1.25
              wrapper.current.style.cursor = cursorMap.zoom
            }
            break
          case 'hand':
            wrapper.current.style.cursor = cursorMap.handAlt
            break
          default:
            wrapper.current.style.cursor = cursorMap[currentAction.toolName]
        }
      })
      viewer.addHandler('canvas-release', (e) => {
        const { originalEvent: { ctrlKey, buttons } } = e
        switch (currentAction.toolName) {
          case 'zoom':
            if (ctrlKey || buttons === 2) {
              wrapper.current.style.cursor = cursorMap.zoomAlt
            } else {
              wrapper.current.style.cursor = cursorMap.zoom
            }
            break
          case 'hand':
            wrapper.current.style.cursor = cursorMap.hand
            break
          default:
            wrapper.current.style.cursor = cursorMap[currentAction.toolName]
        }
      })
    }

    return () => {
      if (viewer) {
        viewer.removeAllHandlers('open')
        viewer.removeAllHandlers('canvas-release')
        viewer.removeAllHandlers('canvas-press')
      }
    }
  }, [objectApparance, viewer, currentAction, cursorMap, setObjects, setBackgroundSettings])

  return (
    <div className='openSeaDragon' ref={wrapper}>
      <div id='openSeaDragonCanvas' className='openSeaDragon__Canvas' />
    </div>
  )
}

export default OpenSeaDragonCanvas
