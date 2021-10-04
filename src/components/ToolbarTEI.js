import ToolbarWindow from './ToolbarWindow'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClipboard } from '@fortawesome/pro-duotone-svg-icons'
import SyntaxHighlighter from 'react-syntax-highlighter'
import style from './ToolbarJSON.module.css'
import { copyTextToClipboard } from '../utils/clipboard'

const TEIToolbar = ({ name, code, close, theme, onStart, onStop }) => {
  return (
    <ToolbarWindow name={name} closeToolbar={close} onStart={onStart} onStop={onStop}>
      <button className={style.Button} onClick={() => copyTextToClipboard(code)}>
        <FontAwesomeIcon icon={faClipboard} />
      </button>
      <SyntaxHighlighter
        language='xml'
        className={style.Code}
        style={theme}
      >
        {code}
      </SyntaxHighlighter>
      <p className='optionsPane__Description'>
        You should use <span className='code'>@facs</span> attribute to align transcription with the image.
      </p>
    </ToolbarWindow>
  )
}

export default TEIToolbar
