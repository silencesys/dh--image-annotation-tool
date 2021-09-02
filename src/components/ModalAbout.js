import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/pro-regular-svg-icons'
import style from './ModalOpenUrl.module.css'
import packageJson from './../../package.json'

const ModalAbout = ({
  closeModal = () => {},
}) => {
  return (
    <div className='Modal__Content'>
      <div className='Modal__TitleBar'>
        <h1 className='Modal__Title'>
          About IMA
        </h1>
        <button className='Modal__CloseButton' onClick={closeModal}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className='Modal__Body'>
        <h2>Image Annotation Tool</h2>
        <p>{packageJson.description}</p>
        <p>Version {packageJson.version}</p>
        <p>Author Martin Roček</p>
      </div>
    </div>
  )
}

export default ModalAbout
