import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/pro-regular-svg-icons'
import style from './ModalOpenUrl.module.css'

const ModalOpenUrl = ({
  closeModal = () => {},
  openUrl = () => {}
}) => {
  const [url, setUrl] = useState('')

  useEffect(() => {
    document.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'Escape':
          closeModal()
          break
        case 'Enter':
          openUrl(url)
          break
        default:
      }
    })
  }, [])

  const handleChange = (e) => {
    setUrl(e.target.value)
  }

  return (
    <div className='Modal__Content'>
      <div className='Modal__TitleBar'>
        <h1 className='Modal__Title'>
          Open High resolution source
        </h1>
        <button className='Modal__CloseButton' onClick={closeModal}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <input
        className={style.ModalOpenUrl__Input}
        type="text"
        placeholder="https://"
        value={url}
        onChange={handleChange}
      />
      <button className={style.ModalOpenUrl__Button} onClick={() => openUrl(url)}>
        Open
      </button>
    </div>
  )
}

export default ModalOpenUrl
