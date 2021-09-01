import { useEffect, useMemo, useRef, useState } from 'react'
import { renderer } from './../utils/transformer'
import Rectangle from './../utils/Rectangle'
import Polygon from './../utils/Polygon'

const Canvas = ({
  currentAction,
  setCurrentAction,
  isDragging,
  objects,
  setObjects,
  backgroundSettings,
  setBackgroundSettings,
  toolCallbacks,
  objectApparance,
  temporaryObjectApparance
}) => {
  // This layer is used to store the background image
  const backgroundLayer = useRef()
  // This layer is used to store the user's drawings
  const storageLayer = useRef()
  // Store points that are used to draw a non rectangular shape.
  const [points, setPoints] = useState([])
  // This state is used to higlight the currently selected object.
  const [selectedObject, setSelectedObject] = useState(null)
  // This layer is used for drawing.
  const drawingLayer = useRef()
  // This is a wrapper for the canvas element that is used for transformations.
  const canvasWrapper = useRef()
  // This state is used to store selected position for the rectangle drawing.
  const [rectCoords, setRectCoords] = useState({ x: 0, y: 0, w: 0, h: 0 })
  // This state is used to store the current state of drawing - eg. whether it
  // is in progress or not.
  const [isDrawing, setIsDrawing] = useState(false)
  // Store instance of transformer renderer which is used for canvas dragging.
  const instance = useRef()
  // Store instance of image editor.
  const imageEditor = useRef()
  // Set global scale for the canvas.
  const [scale, setScale] = useState(1)
  // Store current state of the editor.
  // Store information whether user is dragging object or not.
  const [isDraggingObject, setIsDraggingObject] = useState(false)
  // Cursor map for certain actions.
  const cursorMap = useMemo(() => ({
    zoom: 'zoom-in',
    zoomAlt: 'zoom-out',
    hand: 'grab',
    pathDrawing: 'crosshair',
    rectangleDrawing: 'crosshair',
    erasing: 'default',
    cursor: 'default',
    transformation: 'default'
  }), [])
  // List of available callbacks for actions in the editor.
  toolCallbacks.current = {
    drawPolygonShape: () => {
      if (points.length > 2) {
        const path = new Polygon(points, scale, objectApparance)
        setObjects(state => [...state, path])
        setPoints([])
      }
    },
    handleResetCanvas: () => {
      setObjects([])
      setPoints([])
    }
  }

  /**
   * Register the renderer transformer
  */
  useEffect(() => {
    instance.current = renderer({
      scaleSensitivity: 50,
      minScale: 0.1,
      maxScale: 2,
      element: document.getElementById('imageEditor_Canvas')
    })
    imageEditor.current = document.getElementById('imageEditor')
    canvasWrapper.current.addEventListener('scalechange', (e) => {
      setScale(e.detail.scale)
    })

    const canvas = canvasWrapper.current
    return () => {
      canvas.removeEventListener('scalechange', (e) => {})
    }
  }, [])

  /**
   * Change cursor when tools are selected.
   */
  useEffect(() => {
    canvasWrapper.current.style.cursor = cursorMap[currentAction.toolName]
    document.addEventListener('keydown', ({ ctrlKey }) => {
      if (ctrlKey) {
        try {
          canvasWrapper.current.style.cursor = cursorMap[`${currentAction.toolName}Alt`] || cursorMap[currentAction.toolName]
        } catch (e) {
          // Silent catch.
        }
      }
    })
    document.addEventListener('keyup', () => {
      try {
        canvasWrapper.current.style.cursor = cursorMap[currentAction.toolName]
      } catch (e) {
        // Silent catch.
      }
    })

    return () => {
      document.removeEventListener('keydown', () => {})
      document.removeEventListener('keyup', () => {})
    }
  }, [currentAction.toolName, cursorMap, canvasWrapper])

  useEffect(() => {
    const backgroundActions = ['transformation', 'erasing', 'cursor']
    // Move the storage canvas to front, so user can delete it's content.
    if (backgroundActions.includes(currentAction.toolName)) {
      try {
        storageLayer.current.style.zIndex = '1'
      } catch (e) {
        // Silent catch.
      }
    } else {
      try {
        storageLayer.current.style.zIndex = '0'
      } catch (e) {
        // Silent catch.
      }
    }
  }, [storageLayer, currentAction.toolName])

  useEffect(() => {
  /**
   * Draw image in the background layer.
   * @param {string} url
   * @returns {void}
   */
    const drawImageInBackgroundLayer = (url) => {
      const image = new Image()
      image.src = url
      try {
        image.onload = () => {
          const { naturalHeight, naturalWidth } = image
          // Set size for each layer of the drawing board.
          backgroundLayer.current.height = naturalHeight
          backgroundLayer.current.width = naturalWidth
          drawingLayer.current.height = naturalHeight
          drawingLayer.current.width = naturalWidth
          storageLayer.current.height = naturalHeight
          storageLayer.current.width = naturalWidth

          setBackgroundSettings(state => ({ ...state, lrx: naturalWidth, lry: naturalHeight }))

          const context = backgroundLayer.current.getContext('2d', { alpha: false })
          context.imageSmoothingEnabled = false
          context.drawImage(image, 0, 0, naturalWidth, naturalHeight)

          canvasWrapper.current.style.display = 'block'
        }
      } catch (e) {
        // @TODO: add fail
      }
    }
    drawImageInBackgroundLayer(backgroundSettings.imgUrl)
    toolCallbacks.current.handleResetCanvas()
  }, [backgroundSettings.imgUrl, setBackgroundSettings, toolCallbacks])

  /**
   * Scale and position the canvas when the image is loaded.
  */
  useEffect(() => {
    instance.current.panTo({ originX: -(backgroundSettings.lrx / 2) + (window.innerWidth / 2), originY: -(backgroundSettings.lry / 2) + (window.innerHeight / 2), scale: 1 })
    const scaleWidth = (window.innerWidth - 100) / backgroundSettings.lrx
    const scaleHeight = (window.innerHeight - 100) / backgroundSettings.lry
    const scale = Math.min(scaleWidth, scaleHeight)
    instance.current.zoomTo({ newScale: scale, x: window.innerWidth / 2, y: window.innerHeight / 2 })
  }, [backgroundSettings])

  /**
   * Register an effect that will be triggered each time an array of drawn objects
   * changes.
   */
  useEffect(() => {
    const context = storageLayer.current.getContext('2d')
    context.clearRect(0, 0, storageLayer.current.width, storageLayer.current.height)
    objects.forEach(object => {
      object.draw(context)
    })
  }, [objects, scale])

  // Draw polygon shape after tool change.
  useEffect(() => {
    if (currentAction.toolName !== 'pathDrawing') {
      toolCallbacks.current.drawPolygonShape()
    }
  }, [currentAction.toolName, toolCallbacks])

  /**
   * Register an effect that will be triggered each time user adds a new point
   * to the canvas.
   */
  useEffect(() => {
    // Draw points with each new point added.
    const context = drawingLayer.current.getContext('2d')
    context.clearRect(0, 0, drawingLayer.current.width, drawingLayer.current.height)
    points.forEach(point => {
      Polygon.drawPoint(context, {
        x: point.x,
        y: point.y,
        radius: 4,
        ...temporaryObjectApparance
      }, scale)
    })
  }, [points, scale, temporaryObjectApparance])


  /**
   * Draws a temporary box on the canvas.
   * @param {Object} event - The event that triggered the drawing.
  */
  const drawTemporaryRectangle = ({ buttons, clientY, clientX }) => {
    if (buttons === 1 && !isDragging) {
      const bounding = drawingLayer.current.getBoundingClientRect()
      const context = drawingLayer.current.getContext('2d')
      context.clearRect(0, 0, drawingLayer.current.width, drawingLayer.current.height)
      Rectangle.drawTemporary(context, {
        x: rectCoords.x,
        y: rectCoords.y,
        width: clientX - bounding.left - rectCoords.x,
        height: clientY - bounding.top - rectCoords.y,
        ...temporaryObjectApparance
      }, scale)
    }
  }

  /**
   * Draw a rectangle on the canvas.
   * @param {Object} event - The event that triggered the drawing.
  */
  const drawRectangle = ({ clientX, clientY }) => {
    if (isDrawing) {
      const rectangle = backgroundLayer.current.getBoundingClientRect()
      const width = clientX - rectangle.left - rectCoords.x
      const height = clientY - rectangle.top - rectCoords.y
      const realX = width > 0 ? rectCoords.x : rectCoords.x + width
      const realY = height > 0 ? rectCoords.y : rectCoords.y + height
      const realW = width > 0 ? width : rectCoords.x - realX
      const realH = height > 0 ? height : rectCoords.y - realY

      const box = new Rectangle({ x: realX, y: realY, width: realW, height: realH }, scale, objectApparance)
      setObjects(state => [...state, box])

      const drawContext = drawingLayer.current.getContext('2d')
      drawContext.clearRect(0, 0, drawingLayer.current.width, drawingLayer.current.height)

      setRectCoords(() => ({ x: 0, y: 0, w: 0, h: 0 }))
      setIsDrawing(false)
      setCurrentAction(state => ({ ...state, toolName: 'cursor' }))
    }
  }

  /**
   * Remove object from the canvas.
   * @param {Object} object - The object to remove.
   * @returns {void}
   */
  const removeObject = (object = null) => {
    if (object) {
      setObjects(state => state.filter(obj => obj.id !== object.id))
    }
  }
  /**
   * Higlight hovered object on the canvas.
   * @param {Object} event - The event that triggered the highlighting.
   */
  const higlightHoveredObject = (e) => {
    if (!isDraggingObject) {
      const context = storageLayer.current.getContext('2d')
      for (const [index, object] of objects.entries()) {
        if (context.isPointInPath(object, e.nativeEvent.offsetX, e.nativeEvent.offsetY)) {
          object.currentCentre = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }
          setObjects(state => {
            state[index].strokeStyle = temporaryObjectApparance.strokeStyle
            state[index].fillStyle = temporaryObjectApparance.fillStyle
            return [...state]
          })
          setSelectedObject(object)
          break
        } else if (selectedObject) {
          setSelectedObject(null)
          storageLayer.current.style.cursor = 'default'
          setObjects(state => {
            console.log(object)
            state[index].resetColors()
            return [...state]
          })
        }
      }
    }
  }

  /**
   * Drag an object on the canvas.
   * @param {Object} event - The event that triggered the dragging.
   * @returns {void}
   */
  const dragObjectsOnCanvas = ({ nativeEvent, buttons }) => {
    if (buttons === 1 && selectedObject !== null) {
      storageLayer.current.style.cursor = 'move'
      const context = drawingLayer.current.getContext('2d')
      context.clearRect(0, 0, drawingLayer.current.width, drawingLayer.current.height)

      if (selectedObject.name === 'Rectangle') {
        setSelectedObject(object => {
          try {
            const positionX = (object.currentCentre.x - nativeEvent.offsetX) * object.scale
            const positionY = (object.currentCentre.y - nativeEvent.offsetY) * object.scale
            object.x = object.x - positionX
            object.y = object.y - positionY
            object.currentCentre = { x: nativeEvent.offsetX, y: nativeEvent.offsetY }
          } catch (e) {}
          return object
        })
      } else if (selectedObject.name === 'Polygon') {
        setSelectedObject(object => {
          try {
            object.points = object.points.map(point => {
              const positionX = (object.currentCentre.x - nativeEvent.offsetX) * object.scale
              const positionY = (object.currentCentre.y - nativeEvent.offsetY) * object.scale
              return {
                x: point.x - positionX,
                y: point.y - positionY
              }
            })
            object.currentCentre = { x: nativeEvent.offsetX, y: nativeEvent.offsetY }
          } catch (e) {}
          return object
        })
      }

      if (selectedObject) {
        selectedObject.draw(context, false)
      }
    }
  }

  /**
   * Redraw object to storage layer after movement.
   */
  const redrawObjectAfterMovement = () => {
    const context = drawingLayer.current.getContext('2d')
    context.clearRect(0, 0, drawingLayer.current.width, drawingLayer.current.height)

    if (selectedObject !== null && currentAction.toolName === 'cursor') {
      let object = null
      if (selectedObject.name === 'Rectangle') {
        object = new Rectangle(selectedObject, selectedObject.scale, temporaryObjectApparance)
      } else if (selectedObject.name === 'Polygon') {
        object = new Polygon(selectedObject.points, selectedObject.scale, temporaryObjectApparance)
      }
      object.copyApparance(selectedObject.apparance)
      setObjects(state => [...state, object].filter(Boolean))
    }

    setSelectedObject(null)
    setIsDraggingObject(false)
  }

  /**
   * Handle the zooming of the canvas.
   * @param {Object} event - The event that triggered the event.
   */
  const zoomCanvas = ({ ctrlKey, nativeEvent: { pageX, pageY }, buttons }) => {
    const deltaScale = ctrlKey || buttons === 2 ? -10 : 10
    if (deltaScale === -10) {
      // Set the cursor to zoom-out if the deltaScale is negative.
      canvasWrapper.current.style.cursor = 'zoom-out'
    }
    instance.current.zoom({ deltaScale: deltaScale, x: pageX, y: pageY })
  }

  /**
   * Handle moving the canvas.
   * @param {Object} event - The event that triggered the event.
   */
  const panCanvas = ({ target, movementX, movementY, buttons }) => {
    if (buttons === 1 && imageEditor.current.contains(target) && !isDragging) {
      instance.current.panBy({ originX: movementX, originY: movementY })
    }
  }

  /**
   * Handle the mouse down event on the storage layer.
   * @param {Object} event - The event that triggered the event.
   */
  const handleOnMouseDownOnStorageLayer = (e) => {
    switch (currentAction.toolName) {
      case 'erasing':
        removeObject(selectedObject)
        setSelectedObject(null)
        break
      case 'cursor':
        removeObject(selectedObject)
        setIsDraggingObject(true)
        break
      default:
        // Do nothing
    }
  }

  /**
   * Handle the mouse move event on the storage layer.
   * @param {Object} event - The event that triggered the event.
   */
  const handleOnMouseMoveOnStorageLayer = (e) => {
    switch (currentAction.toolName) {
      case 'cursor':
        higlightHoveredObject(e)
        dragObjectsOnCanvas(e)
        storageLayer.current.style.cursor = 'move'
        break
      case 'erasing':
        higlightHoveredObject(e)
        storageLayer.current.style.cursor = 'pointer'
        break
      default:
        // Do nothing.
    }

    if (selectedObject === null) {
      storageLayer.current.style.cursor = 'default'
    }
  }

  /**
   * Handle the mouse up event on the storage layer.
   * @param {Object} event - The event that triggered the event.
   */
  const handleOnMouseUpOnStorageLayer = (e) => {
    switch (currentAction.toolName) {
      case 'cursor':
        redrawObjectAfterMovement()
        break
      default:
        // Do nothing.
    }
  }

  /**
   * Handle the mouse down event on the canvas wrapper.
   * @param {Object} event - The event that triggered the event.
   */
  const handleOnMouseDownOnCanvasWrapper = (e) => {
    switch (currentAction.toolName) {
      case 'zoom':
        zoomCanvas(e)
        break
      case 'hand':
        canvasWrapper.current.style.cursor = 'grabbing'
        break
      default:
        // do nothing
    }
  }

  /**
   * Handle the mouse move event on the canvas wrapper.
   * @param {Object} event - The event that triggered the movement.
  */
  const handleOnMouseMoveOnCanvasWrapper = (e) => {
    switch (currentAction.toolName) {
      case 'hand':
        panCanvas(e)
        break
      default:
        // Do nothing.
    }
  }

  /**
   * Handle the mouse up event on the canvas wrapper.
   * @param {Object} event - The event that triggered the event.
   */
  const handleOnMouseUpOnCanvasWrapper = (e) => {
    switch (currentAction.toolName) {
      case 'zoom':
        canvasWrapper.current.style.cursor = 'zoom-in'
        break
      case 'hand':
        canvasWrapper.current.style.cursor = 'grab'
        break
      default:
        // do nothing
    }
  }

  /**
 * Handle on mouse down events on the drawing layer. This should be used as
 * a crossroad to redirect to other actions.
 * @param {Object} event - The event that triggered the drawing.
 */
  const handleOnMouseDownOnDrawingLayer = (e) => {
    const bounding = drawingLayer.current.getBoundingClientRect()
    switch (currentAction.toolName) {
      case 'rectangleDrawing':
        setRectCoords(state => ({ ...state, x: e.clientX - bounding.left, y: e.clientY - bounding.top }))
        setIsDrawing(true)
        break
      case 'pathDrawing':
        setPoints(state => [...state, { x: e.clientX - bounding.left, y: e.clientY - bounding.top }])
        break
      default:
        // Do nothing
    }
  }

  /**
   * Handle on mouse move events on the drawing layer. This should be used as
   * a crossroad to redirect to other actions.
   * @param {Object} event - The event that triggered the drawing.
   */
  const handleOnMouseMoveOnDrawingLayer = (e) => {
    switch (currentAction.toolName) {
      case 'rectangleDrawing':
        drawTemporaryRectangle(e)
        break
      default:
        // Do nothing
    }
  }

  /**
   * Handle on mouse up events on the drawing layer. This should be used as
   * a crossroad to redirect to other actions.
   * @param {Object} event - The event that triggered the drawing.
   */
  const handleOnMouseUpOnDrawingLayer = (e) => {
    switch (currentAction.toolName) {
      case 'rectangleDrawing':
        drawRectangle(e)
        break
      default:
        // do nothing
    }
  }

  return (
    <div
      id='imageEditor'
      className={`imageEditor ${backgroundSettings.fileName ? '' : 'imageEditor__ChooseFile'}`}
    >
      <div
        id='imageEditor_Canvas'
        className='imageEditor_Canvas'
        ref={canvasWrapper}
        onMouseDown={handleOnMouseDownOnCanvasWrapper}
        onMouseMove={handleOnMouseMoveOnCanvasWrapper}
        onMouseUp={handleOnMouseUpOnCanvasWrapper}
      >
        <canvas width={400} height={400} ref={backgroundLayer}>
          Background layer
        </canvas>
        <canvas
          width={400}
          height={400}
          ref={storageLayer}
          className='fixedLayer'
          onMouseMove={handleOnMouseMoveOnStorageLayer}
          onMouseDown={handleOnMouseDownOnStorageLayer}
          onMouseUp={handleOnMouseUpOnStorageLayer}
        >
          Storage layer
        </canvas>
        <canvas
          width={400}
          height={400}
          onMouseDown={handleOnMouseDownOnDrawingLayer}
          onMouseUp={handleOnMouseUpOnDrawingLayer}
          onMouseMove={handleOnMouseMoveOnDrawingLayer}
          onMouseLeave={handleOnMouseUpOnDrawingLayer}
          ref={drawingLayer}
          className='fixedLayer'
        >
          Drawing layer
        </canvas>
      </div>
    </div>
  )
}

export default Canvas
