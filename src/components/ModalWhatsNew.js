import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/pro-regular-svg-icons'
import style from './ModalWhatsNew.module.css'

const ModalWhatsNew = ({
  closeModal = () => {},
  doneCallback = null
}) => {
  const [selectedNewIndex, setSelectedNewIndex] = useState(0)

  const content = [{
    title: 'IIIF and DZI support',
    slug: 'iiif-support',
    cover: '/whats-new/iiif-support.png',
    content: 'IMA now supports zoning on IIIF and DZI images, simply choose File > New > Open URL and paste your high-resolution zoomable image URL.'
  }, {
    title: 'Enhanced tooltips for tools',
    slug: 'enhanced-tooltips',
    cover: '/whats-new/enhanced-tooltips.png',
    content: 'The tooltips for the tools have been improved to show the full name of the tool and its description with small video showing their functionality.'
  }, {
    title: 'New menus',
    slug: 'new-menus',
    cover: '/whats-new/new-menus.png',
    content: 'A new slightly more complex of menus was introduced. This will change will bring much convinient way to introduce new features in future.'
  }]

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
          {content.map(({ title, slug }, index) => (
            <li key={slug}>
              <button className={`${style.ButtonList__Button} ${index === selectedNewIndex && style.ButtonList__Button_Active}`} onClick={() => setSelectedNewIndex(index)}>
                {title}
              </button>
            </li>
          ))}
        </ul>
        <div>
          {selectedNewIndex < content.length - 1 ? <button className={style.Modal__SidePane__Button} onClick={() => setSelectedNewIndex(state => state + 1)}>
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