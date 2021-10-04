import Draggable from 'react-draggable'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/pro-regular-svg-icons'
import style from './ToolbarWindow.module.css'

const ToolbarWindow = ({ children, closeToolbar = () => {}, name = 'Placeholder', onStart, onStop }) => {
  const idName = name.replace(' ', '_')
  return (
    <Draggable
      bounds='body'
      handle={`#window_${idName}`}
      onStart={onStart}
      onStop={onStop}
    >
      <div className={style.Window}>
        <div id={`window_${idName}`} className={style.Title}>
          <h4>{name}</h4>
          <button onClick={closeToolbar}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className={style.Content}>
          {children}
        </div>
      </div>
    </Draggable>
  )
}

export default ToolbarWindow
