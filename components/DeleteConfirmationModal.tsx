import React, { ReactElement, useEffect, useRef } from 'react'

interface DeleteConfirmationModalProps {
  pageTitle: string;
  onDelete(): void;
  setModalVisible(isVisible: boolean): void
}

export function DeleteConfirmationModal(props: DeleteConfirmationModalProps): ReactElement {
  const modalRef = useRef<HTMLDivElement>()
  useEffect(() => {
    modalRef.current?.addEventListener('show.bs.modal', () => props.setModalVisible?.(true))
    modalRef.current?.addEventListener('hidden.bs.modal', () => props.setModalVisible?.(false))
  }, [modalRef.current])

  return <div className="modal fade" id="deleteConfirmation" ref={modalRef} tabIndex={-1}
              aria-labelledby="deleteConfirmationLabel" aria-hidden="true">
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">האם ברצונך למחוק את הדף <b>{props.pageTitle}</b>?</h5>
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="ביטול"/>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">ביטול</button>
          <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={props.onDelete}>מחק את הדף
          </button>
        </div>
      </div>
    </div>
  </div>
}
