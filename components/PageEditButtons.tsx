import React, { ReactElement, MouseEvent } from 'react'
import { PageData } from '../types/PageData'

interface Props {
  page: PageData
  isGuestLogin: boolean
  startEditing(): void
  closePage?(): void
}

export const PageEditButtons = ({ page, isGuestLogin, startEditing, closePage }: Props): ReactElement => {
  function showHistory(event: MouseEvent) {
    event.preventDefault()
  }

  function getLastEditedText() {
    const today = new Date()
    const lastEdited = new Date(page._updatedDate)
    if (today.toLocaleDateString() === lastEdited.toLocaleDateString()) {
      return `נערך לאחרונה היום ב-${lastEdited.toLocaleTimeString()}`
    }

    if (new Date(today.setDate(today.getDate() - 1)).toLocaleDateString() === lastEdited.toLocaleDateString()) {
      return `נערך לאחרונה אתמול ב-${lastEdited.toLocaleTimeString()}`
    }

    if (new Date(today.setDate(today.getDate() - 2)).toLocaleDateString() === lastEdited.toLocaleDateString()) {
      return `נערך לאחרונה שלשום ב-${lastEdited.toLocaleTimeString()}`
    }

    return `נערך לאחרונה ב-${lastEdited.toLocaleString()}`
  }

  return isGuestLogin ? null : (<div className="page-edit-buttons float-end d-flex">
    <div className="d-none d-md-block">
      <a href="/" className="history-link" onClick={showHistory}>{getLastEditedText()}</a>
      <button className="btn btn-sm btn-outline-primary" onClick={startEditing}>עריכה</button>
      <button className="btn btn-sm btn-outline-secondary ms-2" data-bs-toggle="modal"
              data-bs-target="#deleteConfirmation" data-bs-page={JSON.stringify(page)}>מחיקה
      </button>
    </div>
    <div className="dropdown d-sm-block d-md-none">
      <button className="btn btn-sm" data-bs-toggle="dropdown">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots"
             viewBox="0 0 16 16">
          <path
            d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
        </svg>
      </button>
      <ul className="dropdown-menu dropdown-menu-start" style={{ minWidth: 'auto' }}>
        <li><a className="dropdown-item" href="/" onClick={e => {
          e.preventDefault()
          startEditing()
        }}>עריכה</a></li>
        <li><a className="dropdown-item" href="/" data-bs-toggle="modal" data-bs-target="#deleteConfirmation">מחיקה</a>
        </li>
      </ul>
    </div>
    {closePage && <button type="button" className="btn-close ms-2" aria-label="Close" onClick={closePage}/>}
  </div>)
}
