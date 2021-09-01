import style from './Modal.module.css'

const Modal = ({ children }) => {
  return (
    <div className={style.Modal}>
      <div className={style.Modal__Content}>
        {children}
      </div>
    </div>
  )
}

export default Modal
