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
import Modal from './components/Modal'
import ModalNew from './components/ModalNew'
import ModalOpenUrl from './components/ModalOpenUrl'
import ModalWhatsNew from './components/ModalWhatsNew'
import ModalAbout from './components/ModalAbout'
import config from './utils/constants/config'
import { convertHexToRgb, convertRgbToHex } from './utils/colors'
import Tooltip from './components/ToolTooltip'

const App = () => {
  // Draggable error silenter.
  const toolBar = useRef(null)
  const optionPane = useRef(null)
  const colorPicker = useRef(null)
  // This state is used to store the current information about size of canvas
  // and name of the file that was used as a background image.
  const [backgroundSettings, setBackgroundSettings] = useState({ lrx: 0, lry: 0, fileName: null, url: null })
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
  const [mode, setMode] = useState('OpenSeaCanvas')
  const [fullScreen, setFullScreen] = useState(false)
  // Configuration for drew objects.
  const [objectApparance, setObjectApparance] = useState({
    fillStyle: config.fill, strokeStyle: config.strokeFill, lineWidth: 3
  })
  // Configuration for objects that are drawn on the canvas.
  const temporaryObjectApparance = useMemo(() => ({
    fillStyle: config.temporaryFill, strokeStyle: config.temporaryStrokeFill, lineWidth: 3
  }), [])
  const [modal, setModal] = useState('ModalWhatsNew')
  // Code pane visibility
  const [codePaneVisible, setCodePaneVisible] = useState(false)
  // Menu items
  const menuItems = [{
    name: 'File',
    items: [{
      name: 'New',
      action: () => setModal('ModalNew')
    }, {
      name: 'Open...',
      action: () => {}
    }, {}, {
      name: 'Save...',
      action: () => {}
    }, {}, {
      name: 'Refresh',
      action: () => window.location.reload()
    }]
  },{
    name: 'View',
    items: [{
        name: `${fullScreen ? 'Exit' : 'Enter'} Fullscreen`,
        action: () => toggleFullScreen(),
        status: codePaneVisible
      }
    ]
  }, {
    name: 'Window',
    items: [{
        name: 'Code Pane',
        action: () => setCodePaneVisible(state => !state),
        status: codePaneVisible
      }
    ]
  }, {
    name: 'Help',
    items: [{
      name: 'What\'s New...',
      action:  () => setModal('ModalWhatsNew')
    }, {}, {
      name: 'About IMA',
      action: () =>  setModal('ModalAbout')
    }, {}, {
      name: 'Send feedback',
      action: () => window.open('https://github.com/silencesys/dh--image-annotation-tool/issues', '_blank')
    }, {
      name: 'GitHub',
      action: () => window.open('https://github.com/silencesys/dh--image-annotation-tool', '_blank')
    }]
  }]
  const canvasComponents = {
    Canvas,
    OpenSeaCanvas
  }
  const SelectedCanvas = canvasComponents[mode]
  const modalComponents = {
    ModalNew,
    ModalOpenUrl,
    ModalWhatsNew,
    ModalAbout
  }
  const SelectedModal = modalComponents[modal]

  const closeModal = () => setModal(null)

  const handleOpenUrl = () => {
    setModal(null)
    setModal('ModalOpenUrl')
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      setFullScreen(true)
      document.documentElement.requestFullscreen()
    } else {
      if (document.exitFullscreen) {
        setFullScreen(false)
        document.exitFullscreen()
      }
    }
  }

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
  const handleOpenFile = () => {
    closeModal()
    setMode('Canvas')
    const file = document.createElement('input')
    file.type = 'file'
    file.accept = '.png, .jpg, .jpeg, .gif, .heic'
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

  const openUrl = (url) => {
    if (url) {
      const fileName = getFileName(url)
      setBackgroundSettings(state => ({ ...state, fileName: fileName, url: url }))
      document.title = `${fileName} - Image Annotation Tool`
      setMode('OpenSeaCanvas')
      setModal(null)
    }
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

const toolDescription = {
  cursor: {
    name: 'Move tool',
    description: 'Move drew objects on the canvas.',
    img: '/tooltip/cursor.gif'
  },
  zoom: {
    name: 'Zoom tool',
    description: 'Zoom in and out on an image. Hold [CTRL] or right-click to zoom out.',
    img: '/tooltip/zoom.gif'
  },
  rectangle: {
    name: 'Rectangle tool',
    description: 'Click and drag to draw a rectangle.',
    img: '/tooltip/rectangle.gif'
  },
  eraser: {
    name: 'Eraser tool',
    description: 'Click on drew objects on the canvas to remove them.',
    img: '/tooltip/eraser.gif'
  },
  hand: {
    name: 'Hand tool',
    description: 'Pans over different parts of an image',
    img: '/tooltip/pan.gif'
  },
  polygon: {
    name: 'Polygon tool',
    description: 'Click to canvas to add points, click again on this button to finish drawing.',
    img: '/tooltip/polygon.gif'
  }
}

  return (
    <div className={currentAction.toolName}>
      <MenuBar menuItems={menuItems} />
      <SelectedCanvas
        currentAction={currentAction}
        objectApparance={objectApparance}
        objects={objects}
        setObjects={setObjects}
        setBackgroundSettings={setBackgroundSettings}
        backgroundSettings={backgroundSettings}
        isDragging={isDragging}
        setCurrentAction={setCurrentAction}
        toolCallbacks={toolCallbacks}
        temporaryObjectApparance={temporaryObjectApparance}
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
          <Tooltip tool={toolDescription.cursor}>
            <button
              onClick={(e) => selectTool(e, 'cursor')}
              className={currentAction.toolName === 'cursor' ? 'toolsPane__Confirmation' : ''}
            >
              <FontAwesomeIcon icon={faMousePointer} />
            </button>
          </Tooltip>
          {/* Disable path drawing tool as path drawing is not yet supported in OpenSeadragon */}
          {mode !== 'OpenSeaCanvas' && <Tooltip tool={toolDescription.polygon}><button
            onClick={(e) => selectTool(e, 'pathDrawing', toolCallbacks?.current?.drawPolygonShape)}
            className={currentAction.toolName === 'pathDrawing' ? 'toolsPane__Confirmation' : ''}
          >
            <FontAwesomeIcon icon={faDrawPolygon} />
          </button></Tooltip>}
          <Tooltip tool={toolDescription.rectangle}>
            <button
              onClick={(e) => selectTool(e, 'rectangleDrawing')}
              className={currentAction.toolName === 'rectangleDrawing' ? 'toolsPane__Confirmation' : ''}
            >
              <FontAwesomeIcon icon={faDrawSquare} />
            </button>
          </Tooltip>
          <Tooltip tool={toolDescription.eraser}>
            <button
              onClick={(e) => selectTool(e, 'erasing')}
              className={currentAction.toolName === 'erasing' ? 'toolsPane__Confirmation' : ''}
            >
              <FontAwesomeIcon icon={faEraser} />
            </button>
          </Tooltip>
          <Tooltip tool={toolDescription.hand}>
          <button
            onClick={(e) => selectTool(e, 'hand')}
            className={currentAction.toolName === 'hand' ? 'toolsPane__Confirmation' : ''}
          >
            <FontAwesomeIcon icon={faHandPaper} />
          </button>
          </Tooltip>
          <Tooltip tool={toolDescription.zoom}>
            <button
              onClick={(e) => selectTool(e, 'zoom')}
              className={currentAction.toolName === 'zoom' ? 'toolsPane__Confirmation' : ''}
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </Tooltip>
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
      {codePaneVisible && <Draggable
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
            <button className='optoinsPane__ClipboardButton' onClick={() => copyTextToClipboard(code)}>
              <FontAwesomeIcon icon={faClipboard} className='optionsPane__ClipboardButton__Icon' />
              Copy to clipboard
            </button>
          </div>
        </div>
      </Draggable>}
      <div className='footer'>
        This project was developed by <a href='https://rocek.dev' target='_blank' rel='noreferrer'>Martin Roček</a>, source code is available on <a href='https://github.com/silencesys/dh--image-annotation-tool' target='_blank' rel='noreferrer'>GitHub</a>. The project is licensed under the EUPL license.
      </div>
      {modal && <Modal>
        <SelectedModal
          closeModal={closeModal}
          handleOpenFile={handleOpenFile}
          handleOpenUrl={handleOpenUrl}
          openUrl={openUrl}
          doneCallback={() => setModal('ModalNew')}
        />
      </Modal>}
    </div>
  )
}

export default App
