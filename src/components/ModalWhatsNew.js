import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/pro-regular-svg-icons'
import style from './ModalWhatsNew.module.css'
import content from '../content/whats-new.json'

const ModalWhatsNew = ({
  closeModal = () => {},
  doneCallback = null
}) => {
  const [selectedNewIndex, setSelectedNewIndex] = useState(0)
  const visibleContent = content.slice(0, 5)

  const closeThisModal = () => {
    if (typeof doneCallback === 'function') {
      doneCallback()
    } else {
      closeModal()
    }
  }

  return (
    <div className='Modal__Content'>
      <div className='Modal__TitleBar'>
        <h1 className='Modal__Title'>
          What's new
        </h1>
        <button className='Modal__CloseButton' onClick={closeModal}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className={style.Modal__Body}>
      <div className={style.Modal__SidePane}>
        <ul className={style.ButtonList}>
          {visibleContent.map(({ title, slug }, index) => (
            <li key={slug}>
              <button className={`${style.ButtonList__Button} ${index === selectedNewIndex && style.ButtonList__Button_Active}`} onClick={() => setSelectedNewIndex(index)}>
                {title}
              </button>
            </li>
          ))}
        </ul>
        <div>
          {selectedNewIndex < visibleContent.length - 1 ? <button className={style.Modal__SidePane__Button} onClick={() => setSelectedNewIndex(state => state + 1)}>
            Next
          </button> :
          <button className={style.Modal__SidePane__Button} onClick={closeThisModal}>
            Done
          </button>}
        </div>
      </div>
      <div>
        {selectedNewIndex !== null && (
          <div className={style.Content}>
            <img src={content[selectedNewIndex].cover} alt={content[selectedNewIndex].title} />
            <h2>{content[selectedNewIndex].title}</h2>
            <p>{content[selectedNewIndex].content}</p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default ModalWhatsNew