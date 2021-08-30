import OpenSeaDragon from 'openseadragon'
import { useEffect, useRef, useState, useMemo } from 'react'
import drawRectangle from '../utils/drawCanvas'
import overlayHandler from '../utils/handleOverlay'

const OpenSeaDragonCanvas = ({ currentAction, objectApparance = { fillStyle: 'red' }, setObjects, objects }) => {
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
   * OpenSeadragon init function.
   */
  const initOpenseadragon = () => {
    viewer && viewer.destroy()
    setViewer(
      OpenSeaDragon({
        id: 'openSeaDragonCanvas',
        prefixUrl: 'https://lipnicebible.ff.cuni.cz/api/img/tile/dzi/',
        tileSources: 'https://lipnicebible.ff.cuni.cz/api/img/tile/dzi/GC_MS_000486_291.dzi',
        animationTime: 0.5,
        showNavigator: false,
        showNavigationControl: false
      })
    )
  }

  /**
   * Initialize canvas element.
   */
  useEffect(() => {
    initOpenseadragon()

    return () => {
      viewer && viewer.destroy()
    }
  }, [])

  const enablePan = (state) => {
    viewer.viewport.panHorizontal = state
    viewer.viewport.panVertical = state
  }

  const enableZoom = (state) => {
    if (!state) {
      const currentScale = viewer.viewport.getZoom(true)
      viewer.viewport.maxZoomLevel = currentScale
      viewer.viewport.minZoomLevel = currentScale
      viewer.viewport.defaultZoomLevel = currentScale
      viewer.viewport.applyConstraints(true)
    } else {
      viewer.viewport.maxZoomLevel = 10
      viewer.viewport.minZoomLevel = 0.5
      viewer.zoomPerScroll = 1
      viewer.zoomPerClick = 1.25
    }
  }

  /**
   * Change cursor and modify canvas according to current action.
   */
  useEffect(() => {
    wrapper.current.style.cursor = cursorMap[currentAction.toolName]
    document.addEventListener('keydown', ({ ctrlKey }) => {
      if (ctrlKey) {
        try {
          wrapper.current.style.cursor = cursorMap[`${currentAction.toolName}Alt`] || cursorMap[currentAction.toolName]
        } catch (e) {
          // Silent catch.
        }
      }
    })
    document.addEventListener('keyup', () => {
      try {
        wrapper.current.style.cursor = cursorMap[currentAction.toolName]
      } catch (e) {
        // Silent catch.
      }
    })

    switch (currentAction.toolName) {
      case 'rectangleDrawing':
        viewer.setMouseNavEnabled(false)
        break
      case 'hand':
        if (viewer) {
          enablePan(true)
          enableZoom(false)
          viewer.setMouseNavEnabled(true)
        }
        break
      case 'zoom':
        enablePan(false)
        enableZoom(true)
        viewer.setMouseNavEnabled(true)
        break
      case 'erasing':
        enablePan(false)
        enableZoom(false)
        viewer.setMouseNavEnabled(false)
        break
      case 'cursor':
        enablePan(false)
        enableZoom(false)
        viewer.setMouseNavEnabled(false)
        break
      default:
        enablePan(false)
        enableZoom(true)
        viewer.setMouseNavEnabled(true)
        // do nothing
    }
  }, [currentAction, cursorMap, viewer])

  const [to, setTo] = useState([])

  useEffect(() => {
    to.forEach(el => {
      el.overlayElement.dataset.tool = currentAction.toolName
      if (['erasing', 'cursor'].includes(currentAction.toolName)) {
        el.overlayHandler = overlayHandler(el, viewer)
      } else {
        if (el.overlayHandler && typeof el.overlayHandler.destroy === 'function') {
          try {
            el.overlayHandler.destroy()
          } catch (e) {
            // fail silently
          }
        }
      }
    })
  }, [to, currentAction, viewer])

  useEffect(() => {
    const updateObjects = (object) => {
      setTo((to) => [...to, object])
    }
    const registerRectangleDrawing = (e) => {
      return drawRectangle(viewer, updateObjects)
    }

    if (viewer) {
      viewer.addHandler('open', registerRectangleDrawing)
      viewer.element.dataset.fillStyle = objectApparance.fillStyle
      viewer.element.dataset.strokeStyle = objectApparance.strokeStyle
      viewer.element.dataset.lineWidth = objectApparance.lineWidth
      viewer.element.dataset.tool = currentAction.toolName

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
        viewer.removeHandler('open', registerRectangleDrawing)
      }
    }
  }, [objectApparance, viewer, currentAction, cursorMap])


  return (
    <div className='openSeaDragon' ref={wrapper}>
      <div id='openSeaDragonCanvas' className='openSeaDragon__Canvas' />
    </div>
  )
}

export default OpenSeaDragonCanvas
