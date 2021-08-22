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

const App = () => {
  const backgroundLayer = useRef()
  const higlightLayer = useRef()
  const drawingLayer = useRef()
  const canvasWrapper = useRef()
  const [rectCoords, setRectCoords] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const [backgroundSettings, setBackgroundSettings] = useState({ lrx: 0, lry: 0, fileName: '' })
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDragging, setisDragging] = useState(false)
  const [selectedObject, setSelectedObject] = useState(null)
  const [scale, setScale] = useState(1)
  const [points, setPoints] = useState([])
  const [objects, setObjects] = useState([])
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 })
  const [currentAction, setCurrentAction] = useState('cursor')
  const timer = useRef(null)

  useEffect(() => {
    // Add event handling for canvases and box reseting
    const resetObjectsOnCanvas = () => {
      setObjects(state => [...state]?.map(obj => {
        obj.fill = 'rgba(30, 62, 111, 0.5)'
        obj.strokeFill = 'rgba(30, 62, 111)'

        return obj
      }))
    }
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
    if (currentAction === 'erasing') {
      if (higlightLayer.current) {
        higlightLayer.current.style.zIndex = '1'
      }
    } else {
      if (higlightLayer.current) {
        higlightLayer.current.style.zIndex = '0'
      }
      resetObjectsOnCanvas()
    }
  }, [higlightLayer, drawingLayer, currentAction])

  useEffect(() => {
    if (points.length !== 0 && currentAction !== 'pathDrawing') {
      drawPathObject(null, true)
    }
  }, [currentAction, points, canvasPosition])

  useEffect(() => {
    // Redraw the boxes each time the array is updated.
    const context = higlightLayer.current.getContext('2d')
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

  useEffect(() => {
    // Draw points with each new point added.
    const context = drawingLayer.current.getContext('2d')
    context.clearRect(0, 0, drawingLayer.current.width, drawingLayer.current.height)
    points.forEach(point => {
      drawPoint(context, point)
    })
  }, [points])

  useEffect(() => {
    if (canvasWrapper) {
      canvasWrapper.current.style.transformOrigin = `${canvasPosition.x}px ${canvasPosition.y}px`
      canvasWrapper.current.style.transform = `scale(${scale})`
    }
  }, [backgroundSettings, scale])

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
   * Choose a file from the file system.
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
      }
      reader.readAsDataURL(file.files[0])
    })
  }

  const drawImageInBackgroundLayer = (url, scale = null) => {
    console.log('loop')
    const image = new Image()
    image.src = url
    image.onload = () => {
      let downScale = 1
      const { naturalHeight, naturalWidth } = image
      downScale = image.naturalHeight > (window.innerHeight - 100)
        ? Math.floor(image.naturalHeight / (window.innerHeight - 100)) * 0.02
        : 1
      setScale(downScale)

      // Set size for each layer of the drawing board.
      backgroundLayer.current.height = naturalHeight
      backgroundLayer.current.width = naturalWidth
      drawingLayer.current.height = naturalHeight
      drawingLayer.current.width = naturalWidth
      higlightLayer.current.height = naturalHeight
      higlightLayer.current.width = naturalWidth

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

  const resetDrawings = () => {
    setObjects(state => [])
    setPoints(state => [])
    setCanvasPosition({ x: 0, y: 0 })
  }

  const copyTextToClipboard = (text) => {
    if (!navigator.clipboard) {
      return
    }
    navigator.clipboard.writeText(text)
  }

  const removeObjectFromCanvas = () => {
    if (selectedObject) {
      setObjects(state => state.filter(object => object.id !== selectedObject.id))
      setSelectedObject(null)
    }
  }

  const higlightHoveredObjects = (e) => {
    if (currentAction === 'erasing') {
      const context = higlightLayer.current.getContext('2d')
      for (const [index, object] of objects.entries()) {
        if (context.isPointInPath(object, e.nativeEvent.offsetX, e.nativeEvent.offsetY)) {
          setSelectedObject(object)
          console.log(selectedObject)
          higlightLayer.current.style.cursor = 'pointer'
          return setObjects(state => {
            state[index].strokeFill = config.temporaryStrokeFill
            state[index].fill = config.temporaryFill
            return [...state]
          })
        } else if (selectedObject) {
          setSelectedObject(null)
          higlightLayer.current.style.cursor = 'default'
          setObjects(state => {
            state[index].strokeFill = config.strokeFill
            state[index].fill = config.fill
            return [...state]
          })
        }
      }

      if (!selectedObject) {
        higlightLayer.current.style.cursor = 'default'
      }
    }
  }

  const handleClicks = (e) => {
    if (currentAction === 'zoom') {
      handleZooming(e)
    }
  }

  const handleZooming = (e) => {
    if (currentAction === 'zoom') {
      // I'm unable to calculate the scale position on the canvas as the numbers
      // sometimes wildly jumps from one to another.
      const bounding = drawingLayer.current.getBoundingClientRect()
      console.log(e.clientX, bounding.left)
      console.log(e)
      if (e.ctrlKey) {
        const posX = -Math.round((e.clientX - bounding.left * scale))
        const posY = -Math.round((e.clientY - bounding.top * scale))
        console.log(posX, posY)
        setCanvasPosition({ x: posX, y: posY })
        setScale(state => {
          let scale = state - 0.2
          scale = Math.round(Math.min(Math.max(0.1, scale), 2) * 100) / 100
          return scale
        })
      } else {
        setScale(state => {
          let scale = state + 0.2
          scale = Math.round(Math.min(Math.max(0.1, scale), 2) * 100) / 100
          return scale
        })
        const posX = -Math.round((e.clientX - bounding.left))
        const posY = -Math.round((e.clientY - bounding.top))
        console.log(posX, posY)
        setCanvasPosition({ x: posX, y: posY })
      }
    }
  }

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
      <div className='imageEditor' onMouseDown={handleClicks}>
        <Draggable
          onStart={() => setisDragging(true)}
          onStop={() => setisDragging(false)}
          disabled={currentAction !== 'cursor'}
          defaultPosition={{ x: 10, y: 10 }}
          offsetParent={document.getElementsByTagName('body')[0]}
        >
          <div>
            <div className={`imageEditor_Canvas ${currentAction === 'cursor' && 'cursor_Hand'}`} ref={canvasWrapper}>
              <canvas width={400} height={400} ref={backgroundLayer}>
                Background layer
              </canvas>
              <canvas
                width={400}
                height={400}
                ref={higlightLayer}
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
        </Draggable>
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
            title='Rectangle drawing tool, click and drag to draw a rectangle.'
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
              Open file
            </button>
            <button onClick={resetDrawings}>
              Reset
            </button>
            <button className='optoinsPane__ClipboardButton' onClick={() => copyTextToClipboard(code)}>
              <FontAwesomeIcon icon={faClipboard} className='optionsPane__ClipboardButton__Icon' />
              Copy to clipboard
            </button>
          </div>
        </div>
      </Draggable>
    </div>
  )
}

export default App
