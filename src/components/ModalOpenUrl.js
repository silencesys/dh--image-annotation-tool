import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/pro-regular-svg-icons'
import style from './ModalOpenUrl.module.css'

const ModalOpenUrl = ({
  closeModal = () => {},
  openUrl = () => {}
}) => {
  const [url, setUrl] = useState('')

  const handleChange = (e) => {
    setUrl(e.target.value)
  }

  return (
    <div className={style.ModalOpenUrl__Content}>
      <div className={style.ModalOpenUrl__TitleBar}>
        <h1 className={style.ModalOpenUrl__Title}>
          Open High resolution source
        </h1>
        <button className={style.ModalOpenUrl__CloseButton} onClick={closeModal}>
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
      <button className={style.ModalOpenUrl__Button} onClick={() => openUrl(url)}>
        Open
      </button>
    </div>
  )
}

export default ModalOpenUrl