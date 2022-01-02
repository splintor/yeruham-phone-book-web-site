import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { AppProps, SearchResults } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { savePage } from '../utils/api'
import { pageUrl } from '../utils/url'
import { deletedPageTitleKey, ToastOptions } from './App'

interface DeleteConfirmationModalProps extends Pick<AppProps, 'search' | 'tags' | 'tag' | 'pages' | 'totalCount'> {
  isPageView: boolean
  setSearchResults(results: SearchResults): void
  setModalVisible(isVisible: boolean): void
  setToast(toastOptions: ToastOptions): void
  pushState(url: string, state: Partial<AppProps>): void
}

export function DeleteConfirmationModal({ setModalVisible, setToast, pushState, pages, totalCount, tags, tag, search, isPageView, setSearchResults }: DeleteConfirmationModalProps): ReactElement {
  const modalRef = useRef<HTMLDivElement>()
  const cancelButtonRef = useRef<HTMLButtonElement>()
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState<PageData>(null)
  useEffect(() => {
    modalRef.current?.addEventListener('show.bs.modal', (event: MouseEvent) => {
      const button = event.relatedTarget as HTMLButtonElement
      const deletedPage = JSON.parse(button.getAttribute('data-bs-page')) as PageData
      setPage(deletedPage)
      return setModalVisible?.(true)
    })
    modalRef.current?.addEventListener('hidden.bs.modal', () => setModalVisible?.(false))
  }, [modalRef.current])

  async function deletePage() {
    setIsDeleting(true)
    await savePage({ ...page, isDeleted: true })

    const cancelDelete = (e: React.MouseEvent) => {
      e.preventDefault()
      setToast(null)
      savePage({ ...page, isDeleted: false }).then(() => {
        pushState(pageUrl(page.title), { page, pages, totalCount, tags, tag, search })
        setToast({ position: 'bottom', content: <div>המחיקה של הדף <b>{page.title}</b> בוטלה.</div> })
      })
    }

    if (isPageView && pages?.length && (pages.length > 1 || pages[0].title !== page.title)) {
      sessionStorage.setItem(deletedPageTitleKey, page.title)
      history.back()
    } else if (!isPageView) {
      setSearchResults({ pages: pages.filter(p => p._id !== page._id), tags, totalCount, search })
    } else {
      pushState('/', {})
    }
    setToast({
      position: 'bottom',
      content: <div>הדף <b>{page.title}</b> נמחק בהצלחה. <a href="/" onClick={cancelDelete}>בטל מחיקה</a></div>
    })
    setIsDeleting(false)
    cancelButtonRef.current.click()
  }

  return <div className="modal fade" id="deleteConfirmation" ref={modalRef} tabIndex={-1}
              aria-labelledby="deleteConfirmationLabel" aria-hidden="true">
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">האם ברצונך למחוק את הדף <b>{page?.title}</b>?</h5>
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="ביטול"/>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" ref={cancelButtonRef}>ביטול</button>
          <button type="button" className="btn btn-danger" disabled={isDeleting} onClick={deletePage}>
            {isDeleting ? 'מוחק...' : 'מחק את הדף'}
          </button>
        </div>
      </div>
    </div>
  </div>
}
