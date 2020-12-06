import React from 'react'

interface ModalProps {
  title: string
  children: React.ReactNode
  show: boolean

  setShow(show: boolean): void

  submitText: string

  onSubmit(): void
}

export function Modal({ title, setShow, ...props }: ModalProps): React.ReactElement<ModalProps> {
  const close = () => setShow(false)
  return props.show && <>
    <div key={`${title}Overlay`} className="overlay" onClick={close}/>
    <div key="${title}Modal" className="modal">
      <div className="modal-title">{title}</div>
      <div className="modal-body">{props.children}</div>
      <div className="modal-buttons">
        <button onClick={() => {
          props.onSubmit()
          close()
        }}>{props.submitText}</button>
        <button className="delete" onClick={close}>ביטול</button>
      </div>
    </div>
  </>
}
