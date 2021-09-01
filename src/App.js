import { useEffect, useMemo, useRef, useState } from 'react'
import Draggable from 'react-draggable'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { stackoverflowLight, stackoverflowDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClipboard, faEraser, faMousePointer, faSearch, faHandPaper, faDrawSquare, faDrawPolygon } from '@fortawesome/pro-duotone-svg-icons'
import './App.css'
import Canvas from './components/Canvas'
import OpenSeaCanvas from './components/OpenSeaDragon'
import MenuBar from './components/MenuBar'
import config from './utils/constants/config'
import { convertHexToRgb, convertRgbToHex } from './utils/colors'

const App = () => {
  // Draggable error silenter.
  const toolBar = useRef(null)
  const optionPane = useRef(null)
  const colorPicker = useRef(null)
  // This state is used to store the current information about size of canvas
  // and name of the file that was used as a background image.
  const [backgroundSettings, setBackgroundSettings] = useState({ lrx: 0, lry: 0, fileName: 'GC_MS_000486_291.dzi', url: 'https://lipnicebible.ff.cuni.cz/api/img/tile/dzi/GC_MS_000486_291.dzi' })
  // Store current state of the editor.
  const [currentAction, setCurrentAction] = useState({ toolName: 'hand', callback: null, event: null })
  // This state is used to store the current state of dragging, so when user
  // starts dragging the canvas does not react as if was drawing.
  const [isDragging, setisDragging] = useState(false)
  // This state is used to store all objects that were drew by user.
  const [objects, setObjects] = useState([])
  // Store code-block theme
  const [codeTheme, setCodeTheme] = useState(stackoverflowLight)
  // List of available tool callbacks.
  const toolCallbacks = useRef({})
  // Configuration for drew objects.
  const [objectApparance, setObjectApparance] = useState({
    fillStyle: config.fill, strokeStyle: config.strokeFill, lineWidth: 3
  })
  // Configuration for objects that are drawn on the canvas.
  const temporaryObjectApparance = useMemo(() => ({
    fillStyle: config.temporaryFill, strokeStyle: config.temporaryStrokeFill, lineWidth: 3
  }), [])

  /**
   * Register the renderer transformer
  */
  useEffect(() => {
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

    return () => {
      document.removeEventListener('contextmenu', () => {})
    }
  }, [])

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
        document.title = `${fileName} - Image Annotation Tool`
      }
      reader.readAsDataURL(file.files[0])
    })
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
   * Select a tool from the toolbar.
   * @param {Object} event - The event that triggered the action.
   * @param {String} tool - The name of the tool to select.
   * @param {Function} [callback] - The callback to run after the tool is selected.
   */
  const selectTool = (e, toolName, callback = null) => {
    setCurrentAction({ toolName, callback, event: e })

    if (typeof callback === 'function') {
      callback(e, toolName)
    }
  }

  const hexToRGBA = (hex, opacity = 1) => {
    const rgb = convertHexToRgb(hex)

    return `rgba(${rgb.join(', ')}, ${opacity})`
  }

  const handleColorChange = ({ target, nativeEvent: { srcElement } }) => {
    const { value: color } = target
    const fillStyle = hexToRGBA(color, 0.5)
    const strokeStyle = hexToRGBA(color)

    const event = new CustomEvent('colorUpdate', { detail: { fillStyle, strokeStyle } })
    srcElement.dispatchEvent(event)

    setObjectApparance(state => ({
      ...state,
      fillStyle,
      strokeStyle
    }))
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
    <div className={currentAction.toolName}>
      <MenuBar />
      <OpenSeaCanvas
        currentAction={currentAction}
        objectApparance={objectApparance}
        objects={objects}
        setObjects={setObjects}
        setBackgroundSettings={setBackgroundSettings}
        backgroundSettings={backgroundSettings}
      />
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
            className={currentAction.toolName === 'cursor' ? 'toolsPane__Confirmation' : ''}
            title='Move tool, move the objects on the canvas.'
          >
            <FontAwesomeIcon icon={faMousePointer} />
          </button>
          <button
            onClick={(e) => selectTool(e, 'pathDrawing', toolCallbacks?.current?.drawPolygonShape)}
            className={currentAction.toolName === 'pathDrawing' ? 'toolsPane__Confirmation' : ''}
            title='Polygon drawing tool, click to canvas to add points, click again on this button to finish drawing.'
          >
            <FontAwesomeIcon icon={faDrawPolygon} />
          </button>
          <button
            onClick={(e) => selectTool(e, 'rectangleDrawing')}
            className={currentAction.toolName === 'rectangleDrawing' ? 'toolsPane__Confirmation' : ''}
            title='Rectangle drawing tool, click and drag to draw a rectangle.'
          >
            <FontAwesomeIcon icon={faDrawSquare} />
          </button>
          <button
            onClick={(e) => selectTool(e, 'erasing')}
            className={currentAction.toolName === 'erasing' ? 'toolsPane__Confirmation' : ''}
            title='Eraser tool, click on drew objects on the canvas to remove them.'
          >
            <FontAwesomeIcon icon={faEraser} />
          </button>
          <button
            onClick={(e) => selectTool(e, 'hand')}
            className={currentAction.toolName === 'hand' ? 'toolsPane__Confirmation' : ''}
            title='Hand tool, grab the canvas and move it around the board.'
          >
            <FontAwesomeIcon icon={faHandPaper} />
          </button>
          <button
            onClick={(e) => selectTool(e, 'zoom')}
            className={currentAction.toolName === 'zoom' ? 'toolsPane__Confirmation' : ''}
            title='Zoom tool, click to zoom-in, hold ctrl and click to zoom-out.'
          >
            <FontAwesomeIcon icon={faSearch} />
          </button>
          <div className='toolsPane__ColorSelectGroup'>
            <div
              className='toolsPane__ColorSelect'
              style={{ backgroundColor: objectApparance.strokeStyle }}
              onClick={() => colorPicker.current.click()}
            />
            <input
              type='color'
              id='tool_ColorPicker'
              className='toolsPane__ColorSelectInput'
              onChange={handleColorChange}
              ref={colorPicker}
              value={convertRgbToHex(objectApparance.strokeStyle)}
            />
          </div>
        </div>
      </Draggable>
      {/* <Draggable
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
            <button onClick={toolCallbacks?.current?.handleResetCanvas} title='Erase everything from canvas.'>
              Reset
            </button>
            <button className='optoinsPane__ClipboardButton' onClick={() => copyTextToClipboard(code)}>
              <FontAwesomeIcon icon={faClipboard} className='optionsPane__ClipboardButton__Icon' />
              Copy to clipboard
            </button>
          </div>
        </div>
      </Draggable> */}
      <div className='footer'>
        This project was developed by <a href='https://rocek.dev' target='_blank' rel='noreferrer'>Martin Roček</a>, source code is available on <a href='https://github.com/silencesys/dh--image-annotation-tool' target='_blank' rel='noreferrer'>GitHub</a>. The project is licensed under the EUPL license.
      </div>
    </div>
  )
}

export default App
