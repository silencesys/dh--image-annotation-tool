/* eslint-disable multiline-ternary */
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/pro-regular-svg-icons'
import style from './ModalFeedback.module.css'

const ModalFeedback = ({
  closeModal = () => {}
}) => {
  const [formContent, setFormContent] = useState({ name: '', email: '', message: '' })
  const [formSubmitted, setFormSubmitted] = useState(false)

  const encodeFormContent = (data) => {
    return Object.keys(data)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
      .join('&')
  }

  const handleSubmit = (e) => {
    // eslint-disable-next-line no-undef
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeFormContent({ 'form-name': 'feedback', ...formContent })
    })
      .then(() => {
        setFormContent({ name: '', email: '', message: '' })
        setFormSubmitted(true)
      })
      .catch(error => console.error(error))

    e.preventDefault()
  }

  const handleChange = (e) => {
    setFormContent({ ...formContent, [e.target.name]: e.target.value })
  }

  return (
    <div className={`Modal__Content ${style.Modal}`}>
      <div className='Modal__TitleBar'>
        <h1 className='Modal__Title'>
          Send feedback
        </h1>
        <button className='Modal__CloseButton' onClick={closeModal}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      {!formSubmitted ? (
        <form
          action='/'
          method='POST'
          name='feedback'
          onSubmit={handleSubmit}
          className={style.Form}
          data-netlify='true'
        >
          <div>
            <label>Name</label>
            <input type='text' name='name' onChange={handleChange} value={formContent.name} required />
          </div>
          <div>
            <label>Email <span className={style.Optional}>(optional)</span></label>
            <input type='email' name='email' onChange={handleChange} value={formContent.email} />
          </div>
          <div className={style.Form__TwoColumnSpan}>
            <label>Message</label>
            <textarea name='message' rows='10' onChange={handleChange} value={formContent.message} required />
          </div>
          <div>
            <button className={style.ButtonSubmit}>
              Submit
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p>Thank you for your feedback!</p>
          <button className={style.ButtonSubmit} onClick={closeModal}>
            Close
          </button>
        </div>
      )}
    </div>
  )
}

export default ModalFeedback
