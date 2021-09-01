import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/pro-regular-svg-icons'
import { faDesktopAlt, faBrowser } from '@fortawesome/pro-duotone-svg-icons'
import style from './ModalNew.module.css'

const ModalNew = ({
  handleOpenFile = () => {},
  handleOpenUrl = () => {},
  closeModal = () => {},
}) => {
  return (
    <div className={style.ModalNew__Content}>
      <div className={style.ModalNew__TitleBar}>
        <h1 className={style.ModalNew__Title}>
          New project
        </h1>
        <button className={style.ModalNew__CloseButton} onClick={closeModal}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className={style.ModalNew__Body}>
        <div>
        <button className={style.ModalNew__ChoiceButton} onClick={handleOpenFile}>
          <FontAwesomeIcon icon={faDesktopAlt} className={style.ModalNew__ChoiceButton__Icon} />
          Browse my computer...
        </button>
        <p>Create new project based on an image in your computer.<strong>Supported formats: JPG, JPEG, BMP, PNG</strong></p>
        </div>
        <div>
        <button className={style.ModalNew__ChoiceButton} onClick={handleOpenUrl}>
          <FontAwesomeIcon icon={faBrowser} className={style.ModalNew__ChoiceButton__Icon} />
          Open URL...
        </button>
        <p>Create new project from high resolution image on internet. <strong>Supported formats: DZI, IIIF</strong></p>
        </div>
      </div>
    </div>
  )
}

export default ModalNew
