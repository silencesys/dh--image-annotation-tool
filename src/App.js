import { useEffect, useMemo, useRef, useState } from 'react'
import Draggable from 'react-draggable'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { stackoverflowLight, stackoverflowDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClipboard, faEraser, faMousePointer, faSearch, faHandPaper, faDrawSquare, faDrawPolygon } from '@fortawesome/pro-duotone-svg-icons'
import './App.css'
import Rectangle from './utils/Rectangle'
import Polygon from './utils/Polygon'
import config from './utils/constants/config'
import { renderer } from './utils/transformer'

const App = () => {
  // This layer is used to store the background image
  const backgroundLayer = useRef()
  // This state is used to store the current information about size of canvas
  // and name of the file that was used as a background image.
  const [backgroundSettings, setBackgroundSettings] = useState({ lrx: 0, lry: 0, fileName: '' })

  // This layer is used to store the user's drawings
  const storageLayer = useRef()
  // Store points that are used to draw a non rectangular shape.
  const [points, setPoints] = useState([])
  // This state is used to store all objects that were drew by user.
  const [objects, setObjects] = useState([])
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
  // This state is used to store the current state of dragging, so when user
  // starts dragging the canvas does not react as if was drawing.
  const [isDragging, setisDragging] = useState(false)
  // Store instance of transformer renderer which is used for canvas dragging.
  const instance = useRef()
  // Store instance of image editor.
  const imageEditor = useRef()
  // Set global scale for the canvas.
  const [scale, setScale] = useState(1)
  // Store current state of the editor.
  const [currentAction, setCurrentAction] = useState('hand')
  // Store information whether user is dragging object or not.
  const [isDraggingObject, setIsDraggingObject] = useState(false)
  // Store code-block theme
  const [codeTheme, setCodeTheme] = useState(stackoverflowLight)
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
  // Configuration for drew objects.
  const objectApparance = useMemo(() => ({
    fillStyle: config.fill, strokeStyle: config.strokeFill, lineWidth: 3
  }), [])
  // Configuration for objects that are drawn on the canvas.
  const temporaryObjectApparance = useMemo(() => ({
    fillStyle: config.temporaryFill, strokeStyle: config.temporaryStrokeFill, lineWidth: 3
  }), [])
  // Draggable error silenter.
  const toolBar = useRef(null)
  const optionPane = useRef(null)

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
    // Prevent context menu from appearing.
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })

    // Switch theme of the code-block.
    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)')
    if (preferredTheme.matches) {
      setCodeTheme(stackoverflowDark)
    }
    preferredTheme.addEventListener('change', (e) => {
      if (e.matches) {
        setCodeTheme(stackoverflowDark)
      } else {
        setCodeTheme(stackoverflowLight)
      }
    })

    const canvas = canvasWrapper.current
    return () => {
      canvas.removeEventListener('scalechange', (e) => {})
      document.removeEventListener('contextmenu', () => {})
    }
  }, [])

  /**
   * Change cursor when tools are selected.
   */
  useEffect(() => {
    canvasWrapper.current.style.cursor = cursorMap[currentAction]
    document.addEventListener('keydown', ({ ctrlKey }) => {
      if (ctrlKey) {
        try {
          canvasWrapper.current.style.cursor = cursorMap[`${currentAction}Alt`] || cursorMap[currentAction]
        } catch (e) {
          // Silent catch.
        }
      }
    })
    document.addEventListener('keyup', () => {
      try {
        canvasWrapper.current.style.cursor = cursorMap[currentAction]
      } catch (e) {
        // Silent catch.
      }
    })

    return () => {
      document.removeEventListener('keydown', () => {})
      document.removeEventListener('keyup', () => {})
    }
  }, [currentAction, cursorMap, canvasWrapper])

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

  useEffect(() => {
    const backgroundActions = ['transformation', 'erasing', 'cursor']
    // Move the storage canvas to front, so user can delete it's content.
    if (backgroundActions.includes(currentAction)) {
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
  }, [storageLayer, currentAction])

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
   * Get file name of the image
   * @param {string} filePath
   * @returns {string}
  */
  const getFileName = (filePath) => {
    const startIndex = (filePath.indexOf('\\') >= 0
      ? filePath.lastIndexOf('\\')
      : filePath.lastIndexOf('/'))

    return filePath.substring(startIndex + 1)
  }

  /**
   * Choose a background file from the file system.
  */
  const chooseFile = () => {
    const file = document.createElement('input')
    file.type = 'file'
    file.accept = '.png, .jpg, .jpeg, .gif'
    file.click()
    file.addEventListener('change', item => {
      const reader = new FileReader()
      const fileName = getFileName(item.target.value)
      reader.onload = (result) => {
        setBackgroundSettings(state => (
          { ...state, fileName: fileName, imgUrl: result.target.result }
        ))
        drawImageInBackgroundLayer(result.target.result)
        resetDrawings()
        document.title = `${fileName} - Image Annotation Tool`
      }
      reader.readAsDataURL(file.files[0])
    })
  }

  /**
   * Draw image in the background layer.
   * @param {string} url
   * @returns {void}
   */
  const drawImageInBackgroundLayer = (url) => {
    const image = new Image()
    image.src = url
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
  }

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
      setCurrentAction('cursor')
    }
  }

  /**
   * Reset all drawings on all canvases.
   */
  const resetDrawings = () => {
    setObjects([])
    setPoints([])
  }

  /**
   * Copy code snippet to clipboard.
   * @param {string} text - The code to copy.
   */
  const copyTextToClipboard = (text) => {
    if (!navigator.clipboard) {
      return
    }
    navigator.clipboard.writeText(text)
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
            state[index].strokeStyle = objectApparance.strokeStyle
            state[index].fillStyle = objectApparance.fillStyle
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
    if (selectedObject !== null && currentAction === 'cursor') {
      let object = null
      if (selectedObject.name === 'Rectangle') {
        object = new Rectangle(selectedObject, selectedObject.scale, temporaryObjectApparance)
      } else if (selectedObject.name === 'Polygon') {
        object = new Polygon(selectedObject.points, selectedObject.scale, temporaryObjectApparance)
      }
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

  const panCanvas = ({ target, movementX, movementY, buttons }) => {
    if (buttons === 1 && imageEditor.current.contains(target) && !isDragging) {
      instance.current.panBy({ originX: movementX, originY: movementY })
    }
  }

  /**
   * Draw a path on the canvas.
  */
  const drawPolygonShape = () => {
    if (currentAction === 'pathDrawing' && points.length > 2) {
      const path = new Polygon(points, scale, objectApparance)
      setObjects(state => [...state, path])
    }
    setPoints([])
  }

  /**
   * Select a tool from the toolbar.
   * @param {Object} event - The event that triggered the action.
   * @param {String} tool - The name of the tool to select.
   * @param {Function} [callback] - The callback to run after the tool is selected.
   */
  const selectTool = (e, toolName, callback = null) => {
    setCurrentAction(toolName)
    if (toolName !== 'pathDrawing' && points.length > 2) {
      drawPolygonShape(e)
    }
    if (typeof callback === 'function') {
      callback(e, toolName)
    }
  }

  /**
   * Handle the mouse down event on the storage layer.
   * @param {Object} event - The event that triggered the event.
   */
  const handleOnMouseDownOnStorageLayer = (e) => {
    switch (currentAction) {
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
    switch (currentAction) {
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
    switch (currentAction) {
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
    switch (currentAction) {
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
    switch (currentAction) {
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
    switch (currentAction) {
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
    switch (currentAction) {
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
    switch (currentAction) {
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
    switch (currentAction) {
      case 'rectangleDrawing':
        drawRectangle(e)
        break
      default:
        // do nothing
    }
  }

  // The code snippet used in the renderer.
  const code = `<facsimile>
  <surface ulx="0" uly="0" lrx="${backgroundSettings.lrx}" lry="${backgroundSettings.lry}">
    <graphic url="/${backgroundSettings.fileName}"/>
` +
  objects.map((box, index) => {
    const name = backgroundSettings.fileName.substring(0, backgroundSettings.fileName.indexOf('.'))
    const id = `fol-${name.substring(name.length - 3)}--${index + 1}`
    switch (box.name) {
      case 'Rectangle':
        return `    <zone xml:id="${id}" ulx="${box.scaled.x}" uly="${box.scaled.y}" lrx="${box.scaled.rx}" lry="${box.scaled.ry}">\n`
      case 'Polygon':
        return `    <zone xml:id="${id}" points="${box.scaledPointsAsString}">\n`
      default:
        return ''
    }
  }).join('') + `  </surface>
</facsimile>`

  return (
    <div>
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
      <Draggable
        onStart={() => setisDragging(true)}
        onStop={() => setisDragging(false)}
        handle='.toolsPane__Head'
        bounds='body'
        nodeRef={toolBar}
      >
        <div className='toolsPane' ref={toolBar}>
          <div className='toolsPane__Head' />
          <button
            onClick={(e) => selectTool(e, 'cursor')}
            className={currentAction === 'cursor' ? 'toolsPane__Confirmation' : ''}
            title='Move tool, move the objects on the canvas.'
          >
            <FontAwesomeIcon icon={faMousePointer} />
          </button>
          <button
            onClick={(e) => selectTool(e, 'pathDrawing', drawPolygonShape)}
            className={currentAction === 'pathDrawing' ? 'toolsPane__Confirmation' : ''}
            title='Polygon drawing tool, click to canvas to add points, click again on this button to finish drawing.'
          >
            <FontAwesomeIcon icon={faDrawPolygon} />
          </button>
          <button
            onClick={(e) => selectTool(e, 'rectangleDrawing')}
            className={currentAction === 'rectangleDrawing' ? 'toolsPane__Confirmation' : ''}
            title='Rectangle drawing tool, click and drag to draw a rectangle.'
          >
            <FontAwesomeIcon icon={faDrawSquare} />
          </button>
          <button
            onClick={(e) => selectTool(e, 'erasing')}
            className={currentAction === 'erasing' ? 'toolsPane__Confirmation' : ''}
            title='Eraser tool, click on drew objects on the canvas to remove them.'
          >
            <FontAwesomeIcon icon={faEraser} />
          </button>
          <button
            onClick={(e) => selectTool(e, 'hand')}
            className={currentAction === 'hand' ? 'toolsPane__Confirmation' : ''}
            title='Hand tool, grab the canvas and move it around the board.'
          >
            <FontAwesomeIcon icon={faHandPaper} />
          </button>
          <button
            onClick={(e) => selectTool(e, 'zoom')}
            className={currentAction === 'zoom' ? 'toolsPane__Confirmation' : ''}
            title='Zoom tool, click to zoom-in, hold ctrl and click to zoom-out.'
          >
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>
      </Draggable>
      <Draggable
        onStart={() => setisDragging(true)}
        onStop={() => setisDragging(false)}
        handle='.optionsPane__Head'
        bounds='body'
        nodeRef={optionPane}
      >
        <div className='optionsPane' ref={optionPane}>
          <header className='optionsPane__Head' />
          <div>
            <SyntaxHighlighter
              language='xml'
              className='optionsPane__pre'
              style={codeTheme}
              showLineNumbers
            >
              {code}
            </SyntaxHighlighter>
          </div>
          <p className='optionsPane__Description'>
            You should use <span className='code'>@facs</span> attribute to align transcription with the image.
          </p>
          <div className='optionsPane__ButtonRow'>
            <button onClick={chooseFile} className='primary'>
              Open image
            </button>
            <button onClick={resetDrawings} title='Erase everything from canvas.'>
              Reset
            </button>
            <button className='optoinsPane__ClipboardButton' onClick={() => copyTextToClipboard(code)}>
              <FontAwesomeIcon icon={faClipboard} className='optionsPane__ClipboardButton__Icon' />
              Copy to clipboard
            </button>
          </div>
        </div>
      </Draggable>
      <div className='footer'>
        This project was developed by <a href='https://rocek.dev'>Martin Roček</a>, source code is available on <a href='https://github.com/silencesys/dh--image-annotation-tool' target='_blank' rel='noreferrer'>GitHub</a>. The project is licensed under the EUPL license.
      </div>
    </div>
  )
}

export default App
