import dynamic from 'next/dynamic'
import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { useKeyPress } from '../hooks/useKeyPress'
import { AppProps } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { savePage } from '../utils/api'
import { pageUrl } from '../utils/url'
import { deletedPageTitleKey, ToastOptions } from './App'
import { PageHtmlRenderer } from './PageHtmlRenderer'
import { TagLink } from './TagLink'
import { TitleLink } from './TitleLink'

const PageEditor = dynamic(() => import('./PageEditor'), { ssr: false })

interface PageContentProps extends Pick<AppProps, 'status' | 'page' | 'search' | 'tag' | 'pages' | 'newPage' | 'totalCount'> {
  pushState(url: string, state: Partial<AppProps>)
  onUpdatePageTitle(page: PageData)
  setToast(toastOptions: ToastOptions)
  isGuestLogin: boolean
  closePage(): void
}

export function PageContent({ search, tag, pushState, setToast, pages, totalCount, closePage, ...props }: PageContentProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false)
  const escapePressed = useKeyPress('Escape')
  const [page, setPage] = useState(props.page)
  const { title, tags } = page

  if (escapePressed && !isDeleteConfirmationVisible) {
    closePage?.()
  }

  useEffect(() => {
    if (!isEditing && props.newPage) {
      setIsEditing(true)
    }
  }, [props.newPage])

  useEffect(() => setPage(props.page), [props.page])

  const deleteConfirmationDialog = useRef<HTMLDivElement>()
  useEffect(() => {
    deleteConfirmationDialog.current?.addEventListener('show.bs.modal', () => setIsDeleteConfirmationVisible(true))
    deleteConfirmationDialog.current?.addEventListener('hidden.bs.modal', () => setIsDeleteConfirmationVisible(false))
  }, [deleteConfirmationDialog.current])

  const saveChanges = async (pageToSave: PageData) => {
    const { title } = pageToSave
    const { ok, status } = await savePage(pageToSave)
    if (!ok) {
      const content = status === 409
        ? <div>דף בשם <b>{title}</b> קיים כבר בספר הטלפונים.<a href={pageUrl(title)}>פתח את הדף הקיים</a></div>
        : <div>השמירה נכשלה...</div>
      setToast({ position: 'bottom', timeout: 8000, content, type: 'fail' })
      return
    }

    if (page.title !== title) {
      props.onUpdatePageTitle(pageToSave)
    }

    setPage(pageToSave)
    setIsEditing(false)
  }

  function cancelEditing(): void {
    if (props.newPage) {
      history.back()
    } else {
      setIsEditing(false)
    }
  }

  const deletePage = useCallback(async () => {
    await savePage({ ...page, isDeleted: true })

    const cancelDelete = (e: React.MouseEvent) => {
      e.preventDefault()
      setToast(undefined)
      savePage({ ...page, isDeleted: false }).then(() => {
        pushState(pageUrl(page.title), { page, pages, totalCount, tags, tag, search })
        setToast({ content: <div>המחיקה של הדף<b>{page.title}</b> בוטלה.</div> })
      })
    }

    if (pages?.length && (pages.length > 1 || pages[0].title !== page.title)) {
      sessionStorage.setItem(deletedPageTitleKey, page.title)
      history.back()
    } else {
      pushState('/', {})
    }
    setToast({ content: <div>הדף<b>{page.title}</b> נמחק בהצלחה.<a href="/" onClick={cancelDelete}>בטל מחיקה</a></div> })
  }, [page])

  switch (props.status) {
    case 404:
      return <div className="results page">
        <div className="notFound">הדף <span className="searchedTitle">{title}</span> לא נמצא בספר הטלפונים.</div>
      </div>

    default:
      return isEditing ? <PageEditor page={page} onCancel={cancelEditing} onSave={saveChanges}/> :
        <div className="p-2">
          <div className="card p-1 mb-3" key={page.title}>
            {props.isGuestLogin || <div className="modal fade" id="deleteConfirmation" ref={deleteConfirmationDialog} tabIndex={-1} aria-labelledby="deleteConfirmationLabel" aria-hidden="true">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{`מחיקת הדף ${title}`}</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="סגור"/>
                  </div>
                  <div className="modal-body">
                    האם ברצונך למחוק את הדף <b>{title}</b>?
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">סגור</button>
                    <button type="button" className="btn btn-danger" onClick={deletePage}>מחק את הדף</button>
                  </div>
                </div>
              </div>
            </div>}
            <div className="card-body p-2">
              <div className="float-end d-flex">
                {props.isGuestLogin || <><div className="d-none d-md-block">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => setIsEditing(true)}>עריכה</button>
                  <button className="btn btn-sm btn-outline-secondary ms-2" data-bs-toggle="modal" data-bs-target="#deleteConfirmation">מחיקה</button>
                </div>
                <div className="dropdown d-sm-block d-md-none">
                  <button className="btn btn-sm" data-bs-toggle="dropdown">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots" viewBox="0 0 16 16">
                      <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                    </svg>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-start" style={{ minWidth: 'auto' }}>
                    <li><a className="dropdown-item" href="/" onClick={e => {
                      e.preventDefault()
                      setIsEditing(true)
                    }}>עריכה</a></li>
                    <li><a className="dropdown-item" href="/" data-bs-toggle="modal" data-bs-target="#deleteConfirmation">מחיקה</a></li>
                  </ul>
                </div>
                </>}
                {pages && <button type="button" className="btn-close ms-2" aria-label="Close" onClick={closePage}/>}
              </div>
              <h5 className="card-title">
                <TitleLink title={page.title} key={page.title}/>
              </h5>
              <PageHtmlRenderer pushState={pushState} page={page} pages={pages} totalCount={totalCount} search={search} tags={tags} tag={tag}/>
              <div className="tags">
                {tags && tags.map(t => <TagLink key={t} tag={t} pushState={pushState} className="titleLink tag"/>)}
              </div>
            </div>
          </div>
        </div>
  }
}
