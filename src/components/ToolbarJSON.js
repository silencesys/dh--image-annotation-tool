import ToolbarWindow from './ToolbarWindow'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClipboard } from '@fortawesome/pro-duotone-svg-icons'
import SyntaxHighlighter from 'react-syntax-highlighter'
import style from './ToolbarJSON.module.css'
import { copyTextToClipboard } from '../utils/clipboard'

const JSONToolbar = ({ name, content, close, theme, onStart, onStop }) => {
  const windowContent = JSON.stringify(content, null, 2)

  return (
    <ToolbarWindow name={name} closeToolbar={close} onStart={onStart} onStop={onStop}>
      <button className={style.Button} onClick={() => copyTextToClipboard(windowContent)}>
        <FontAwesomeIcon icon={faClipboard} />
      </button>
      <SyntaxHighlighter
        language='json'
        className={style.Code}
        style={theme}
      >
        {windowContent}
      </SyntaxHighlighter>
    </ToolbarWindow>
  )
}

export default JSONToolbar
