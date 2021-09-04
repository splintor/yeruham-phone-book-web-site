import React, { ReactElement } from 'react'
import { AppProps } from '../types/AppProps'
import { savePage } from '../utils/api'
import { pageUrl } from '../utils/url'
import { deletedPageTitleKey, ToastOptions } from './App'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'

interface Props extends Pick<AppProps, 'page' | 'search' | 'tags' | 'tag' | 'pages' | 'totalCount'> {
  isGuestLogin: boolean
  startEditing(): void
  setToast(toastOptions: ToastOptions): void
  pushState(url: string, state: Partial<AppProps>): void
  setIsDeleteConfirmationVisible?(isVisible: boolean): void
  closePage?(): void
}

export const PageEditButtons = ({ page, setToast, pages, totalCount, tags, tag, search, pushState, startEditing, closePage, ...props }: Props): ReactElement => {
  async function deletePage() {
    await savePage({ ...page, isDeleted: true })

    const cancelDelete = (e: React.MouseEvent) => {
      e.preventDefault()
      setToast(null)
      savePage({ ...page, isDeleted: false }).then(() => {
        pushState(pageUrl(page.title), { page, pages, totalCount, tags, tag, search })
        setToast({ position: 'bottom', content: <div>המחיקה של הדף <b>{page.title}</b> בוטלה.</div> })
      })
    }

    if (pages?.length && (pages.length > 1 || pages[0].title !== page.title)) {
      sessionStorage.setItem(deletedPageTitleKey, page.title)
      history.back()
    } else {
      pushState('/', {})
    }
    setToast({
      position: 'bottom',
      content: <div>הדף <b>{page.title}</b> נמחק בהצלחה. <a href="/" onClick={cancelDelete}>בטל מחיקה</a></div>
    })
  }

  return props.isGuestLogin ? null : (<div className="page-edit-buttons float-end d-flex">
    <DeleteConfirmationModal pageTitle={page.title}
                             setModalVisible={props.setIsDeleteConfirmationVisible}
                             onDelete={deletePage}/>
    <div className="d-none d-md-block">
      <button className="btn btn-sm btn-outline-primary" onClick={startEditing}>עריכה</button>
      <button className="btn btn-sm btn-outline-secondary ms-2" data-bs-toggle="modal"
              data-bs-target="#deleteConfirmation">מחיקה
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
    {pages && closePage && <button type="button" className="btn-close ms-2" aria-label="Close" onClick={closePage}/>}
  </div>)
}
