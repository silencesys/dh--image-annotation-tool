import { useEffect, useRef, useState } from 'react'
import Draggable from 'react-draggable'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { stackoverflowLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClipboard, faSquare, faCrosshairs, faEraser, faMousePointer, faSearch } from '@fortawesome/pro-duotone-svg-icons'
import './App.css'
import Box from './utils/Box'
import Path from './utils/Path'
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
  const [currentAction, setCurrentAction] = useState('cursor')

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
    // Add event handling for canvases and box reseting
    const resetObjectsOnCanvas = () => {
      setObjects(state => [...state]?.map(obj => {
        obj.fill = config.fill
        obj.strokeFill = config.strokeFill
        return obj
      }))
    }
    // Prevent context menu from appearing.
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
    // Move the storage canvas to front, so user can delete it's content.
    if (currentAction === 'erasing') {
      if (storageLayer.current) {
        storageLayer.current.style.zIndex = '1'
      }
    } else {
      if (storageLayer.current) {
        storageLayer.current.style.zIndex = '0'
      }
      // Ensure that everything that remained is back in it's initial state.
      resetObjectsOnCanvas()
    }
  }, [storageLayer, currentAction])

  /**
   * Register an effect that will be triggered each time user changes the tool.
   * This should unsure that canvas will be always clear and prepared for drawing
   * new objects.
   */
  useEffect(() => {
    if (points.length !== 0 && currentAction !== 'pathDrawing') {
      drawPathObject(null, true)
    }
  }, [currentAction, points])

  /**
   * Register an effect that will be triggered each time an array of drawn objects
   * changes.
   */
  useEffect(() => {
    const context = storageLayer.current.getContext('2d')
    context.clearRect(0, 0, drawingLayer.current.width, drawingLayer.current.height)
    objects.forEach(box => {
      const type = box.name.toLowerCase()
      const methods = {
        box: drawBox,
        path: drawPath
      }
      methods[type](context, box)
    })
  }, [objects])

  /**
   * Register an effect that will be triggered each time user adds a new point
   * to the canvas.
   */
  useEffect(() => {
    // Draw points with each new point added.
    const context = drawingLayer.current.getContext('2d')
    context.clearRect(0, 0, drawingLayer.current.width, drawingLayer.current.height)
    points.forEach(point => {
      drawPoint(context, point)
    })
  }, [points])

  /**
   * Get file name of the image
   * @param {string} filePath
   * @returns {string}
  */
  const getFileName = (filePath) => {
    const startIndex = (filePath.indexOf('\\') >= 0 ? filePath.lastIndexOf('\\') : filePath.lastIndexOf('/'))
    return filePath.substring(startIndex + 1)
  }

  /**
   * Choose a background file from the file system.
  */
  const chooseFile = () => {
    const file = document.createElement('input')
    file.type = 'file'
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
    console.log('loop')
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
   * Draw a box on the canvas.
   * @param {object} context
   * @param {object} box
  */
  const drawBox = (context, box) => {
    context.beginPath()
    context.lineWidth = box.stroke
    context.strokeStyle = box.strokeFill
    context.fillStyle = box.fill
    box.rect(box.x, box.y, box.w, box.h)
    context.stroke(box)
    context.fill(box)
  }

  /**
   * Draw a point on the canvas.
   * @param {object} context
   * @param {object} point
  */
  const drawPoint = (context, point) => {
    context.beginPath()
    context.lineWidth = 2
    context.strokeStyle = config.temporaryStrokeFill
    context.fillStyle = config.temporaryFill
    context.arc(point.x / scale, point.y / scale, 4 / scale, 0, 2 * Math.PI)
    context.stroke()
    context.fill()
  }

  /**
   * Draw a path on the canvas.
  */
  const drawPathObject = (e, skipTool = false) => {
    if (
      (currentAction === 'pathDrawing' && points.length > 2) ||
      (skipTool && points.length > 2)
    ) {
      const path = new Path(3, scale, `${backgroundSettings.fileName}-${objects.length}`)
      path.points = points
      path.fill = config.fill
      path.strokeFill = config.strokeFill
      setObjects(state => [...state, path])
    }

    setPoints([])
    if (!skipTool) {
      setCurrentAction('pathDrawing')
    }
  }

  /**
   * Draw a path on the canvas.
   * @param {object} context
   * @param {object} path
  */
  const drawPath = (context, path) => {
    context.beginPath()
    context.lineWidth = path.stroke
    context.fillStyle = path.fill
    context.strokeStyle = path.strokeFill
    path.points.forEach((coords, index) => {
      if (index === 0) {
        path.moveTo(coords.x / scale, coords.y / scale)
      } else {
        path.lineTo(coords.x / scale, coords.y / scale)
      }
    })
    path.closePath()
    context.stroke(path)
    context.fill(path)
  }

  /**
   * Draws a box or a point on the canvas.
   * @param {Object} event - The event that triggered the drawing.
   */
  const startDrawingOrPoiting = (e) => {
    const { clientX, clientY } = e
    const bounding = drawingLayer.current.getBoundingClientRect()
    if (currentAction === 'rectangleDrawing') {
      setRectCoords(state => ({ ...state, x: clientX - bounding.left, y: clientY - bounding.top }))
    } else if (currentAction === 'pathDrawing') {
      setPoints(state => [...state, { x: clientX - bounding.left, y: clientY - bounding.top }])
    }
  }

  /**
   * Draws a temporary box on the canvas.
   * @param {Object} event - The event that triggered the drawing.
  */
  const drawTemporaryRectangle = ({ buttons, clientY, clientX }) => {
    if (buttons === 1 && currentAction === 'rectangleDrawing' && !isDragging) {
      const bounding = drawingLayer.current.getBoundingClientRect()
      const context = drawingLayer.current.getContext('2d')
      context.beginPath()
      context.lineWidth = config.strokeWidth
      context.strokeStyle = config.temporaryStrokeFill
      context.fillStyle = config.temporaryFill
      context.clearRect(0, 0, drawingLayer.current.width, drawingLayer.current.height)
      context.rect(rectCoords.x / scale, rectCoords.y / scale, (clientX - bounding.left - rectCoords.x) / scale, (clientY - bounding.top - rectCoords.y) / scale)
      context.stroke()
      context.fill()
      setIsDrawing(true)
    }
  }

  /**
   * Draw a rectangle on the canvas.
   * @param {Object} event - The event that triggered the drawing.
  */
  const drawRectangle = ({ clientX, clientY }) => {
    if (isDrawing && currentAction === 'rectangleDrawing') {
      const rectangle = backgroundLayer.current.getBoundingClientRect()
      const width = clientX - rectangle.left - rectCoords.x
      const height = clientY - rectangle.top - rectCoords.y
      const realX = width > 0 ? rectCoords.x : rectCoords.x + width
      const realY = height > 0 ? rectCoords.y : rectCoords.y + height
      const realW = width > 0 ? width : rectCoords.x - realX
      const realH = height > 0 ? height : rectCoords.y - realY

      const box = new Box(realX / scale, realY / scale, realW / scale, realH / scale, config.strokeWidth, 1)
      box.fill = config.fill
      box.strokeFill = config.strokeFill
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
    setObjects(state => [])
    setPoints(state => [])
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
   * Remove object from teh canvas.
  */
  const removeObjectFromCanvas = () => {
    if (selectedObject) {
      setObjects(state => state.filter(object => object.id !== selectedObject.id))
      setSelectedObject(null)
    }
  }

  /**
   * Higlight hovered object on the canvas.
   * @param {Object} event - The event that triggered the highlighting.
   */
  const higlightHoveredObjects = (e) => {
    if (currentAction === 'erasing') {
      const context = storageLayer.current.getContext('2d')
      for (const [index, object] of objects.entries()) {
        if (context.isPointInPath(object, e.nativeEvent.offsetX, e.nativeEvent.offsetY)) {
          setSelectedObject(object)
          console.log(selectedObject)
          storageLayer.current.style.cursor = 'pointer'
          return setObjects(state => {
            state[index].strokeFill = config.temporaryStrokeFill
            state[index].fill = config.temporaryFill
            return [...state]
          })
        } else if (selectedObject) {
          setSelectedObject(null)
          storageLayer.current.style.cursor = 'default'
          setObjects(state => {
            state[index].strokeFill = config.strokeFill
            state[index].fill = config.fill
            return [...state]
          })
        }
      }

      if (!selectedObject) {
        storageLayer.current.style.cursor = 'default'
      }
    }
  }

  /**
   * Register the keydown event listener. Currently only used for changing the
   * cursor.
   */
  useEffect(() => {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && currentAction === 'zoom') {
        canvasWrapper.current.style.cursor = 'zoom-out'
      }
    })
    document.addEventListener('keyup', (e) => {
      if (currentAction === 'zoom') {
        canvasWrapper.current.style.cursor = 'zoom-in'
      }
    })

    return () => {
      document.removeEventListener('keydown', (e) => {})
      document.removeEventListener('keyup', (e) => {})
    }
  })

  /**
   * Change cursor when tools are selected.
   */
  useEffect(() => {
    const cursorMap = {
      zoom: 'zoom-in',
      cursor: 'grab',
      pathDrawing: 'crosshair',
      rectangleDrawing: 'crosshair',
      erasing: 'default'
    }
    canvasWrapper.current.style.cursor = cursorMap[currentAction]
  }, [currentAction])

  /**
   * Handle the mouse down event on the canvas wrapper.
   * @param {Object} event - The event that triggered the event.
   */
  const handleClickOnCanvasWrapper = (e) => {
    if (currentAction === 'zoom') {
      const deltaScale = e.ctrlKey ? -10 : 10
      instance.current.zoom({ deltaScale: deltaScale, x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })
    } else if (currentAction === 'cursor') {
      canvasWrapper.current.style.cursor = 'grabbing'
    }
  }

  /**
   * Handle the mouse move event on the canvas wrapper.
   * @param {Object} event - The event that triggered the movement.
  */
  const handleMovementOnCanvasWrapper = (e) => {
    if (currentAction === 'cursor' && e.buttons === 1 && imageEditor.current.contains(e.target) && !isDragging) {
      instance.current.panBy({ originX: e.movementX, originY: e.movementY })
    }
  }

  /**
   * Handle the mouse up event on the canvas wrapper.
   * @param {Object} event - The event that triggered the event.
   */
  const handleMouseUpOnCanvasWrapper = (e) => {
    if (currentAction === 'cursor') {
      canvasWrapper.current.style.cursor = 'grab'
    }
  }

  // The code snippet used in the renderer.
  const code = `<facsimile>
  <surface ulx="0" uly="0" lrx="${backgroundSettings.lrx}" lry="${backgroundSettings.lry}">
    <graphic url="/${backgroundSettings.fileName}"/>
` +
  objects?.map((box, index) => {
    const prefix = index === 0 ? '    ' : '\n    '
    const name = backgroundSettings.fileName.substring(0, backgroundSettings.fileName.indexOf('.'))
    const id = `fol-${name.substring(name.length - 3)}--${index + 1}`
    if (box.name === 'Path') {
      return (
        `${prefix}<zone xml:id="${id}" points="${box.pointsScaled.join(' ')}">`
      )
    } else {
      return (
        `${prefix}<zone xml:id="${id}" ulx="${box.scaled.x}" uly="${box.scaled.y}" lrx="${box.scaled.rx}" lry="${box.scaled.ry}">`
      )
    }
  }) + `
  </surface>
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
          onMouseDown={handleClickOnCanvasWrapper}
          onMouseMove={handleMovementOnCanvasWrapper}
          onMouseUp={handleMouseUpOnCanvasWrapper}
        >
          <canvas width={400} height={400} ref={backgroundLayer}>
            Background layer
          </canvas>
          <canvas
            width={400}
            height={400}
            ref={storageLayer}
            className='fixedLayer'
            onMouseMove={higlightHoveredObjects}
            onMouseDown={removeObjectFromCanvas}
          >
            Higlights layer
          </canvas>
          <canvas
            width={400}
            height={400}
            onMouseDown={startDrawingOrPoiting}
            onMouseUp={drawRectangle}
            onMouseMove={drawTemporaryRectangle}
            onMouseLeave={drawRectangle}
            onTouchStart={startDrawingOrPoiting}
            onTouchEnd={drawRectangle}
            onTouchMove={drawTemporaryRectangle}
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
      >
        <div className='toolsPane'>
          <div className='toolsPane__Head' />
          <button
            onClick={() => setCurrentAction('cursor')}
            className={currentAction === 'cursor' && 'toolsPane__Confirmation'}
            title='Move tool, move the canvas around the board.'
          >
            <FontAwesomeIcon icon={faMousePointer} />
          </button>
          <button
            onClick={drawPathObject}
            className={currentAction === 'pathDrawing' && 'toolsPane__Confirmation'}
            title='Path drawing tool, click to canvas to add points, click again on this button to finish drawing.'
          >
            <FontAwesomeIcon icon={faCrosshairs} />
          </button>
          <button
            onClick={() => setCurrentAction('erasing')}
            className={currentAction === 'erasing' && 'toolsPane__Confirmation'}
            title='Eraser tool, click on drew objects on the canvas to remove them.'
          >
            <FontAwesomeIcon icon={faEraser} />
          </button>
          <button
            onClick={() => setCurrentAction('rectangleDrawing')}
            className={currentAction === 'rectangleDrawing' && 'toolsPane__Confirmation'}
            title='Rectangle drawing tool, click and drag to draw a rectangle.'
          >
            <FontAwesomeIcon icon={faSquare} />
          </button>
          <button
            onClick={() => setCurrentAction('zoom')}
            className={currentAction === 'zoom' && 'toolsPane__Confirmation'}
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
      >
        <div className='optionsPane'>
          <header className='optionsPane__Head' />
          <div>
            <SyntaxHighlighter
              language='xml'
              className='optionsPane__pre'
              style={stackoverflowLight}
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
        This project was developed by <a href='https://rocek.dev'>Martin Roček</a>, source code is available on <a href='https://github.com' target='_blank' rel='noreferrer'>GitHub</a>. The project is licensed under the EUPL license.
      </div>
    </div>
  )
}

export default App
