import dynamic from 'next/dynamic'
import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { useKeyPress } from '../hooks/useKeyPress'
import { AppProps } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { savePage } from '../utils/api'
import { pageUrl } from '../utils/url'
import { deletedPageTitleKey, ToastOptions } from './App'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
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

export function PageContent({ search, tag, pushState, setToast, pages, totalCount, closePage, isGuestLogin, ...props }: PageContentProps): ReactElement {
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

  const saveChanges = async (pageToSave: PageData) => {
    const { title, _id } = pageToSave
    const response = await savePage(pageToSave)
    const { ok, status } = response
    if (!ok) {
      const content = status === 409
        ? <div>דף בשם <b>{title}</b> קיים כבר בספר הטלפונים. <a href={pageUrl(title)}>פתח את הדף הקיים</a></div>
        : <div>השמירה נכשלה...</div>
      setToast({ position: 'bottom', content, type: 'fail' })
      return
    }

    if (!_id) {
      pageToSave._id = (await response.json())._id
    }

    if (page.title !== title) {
      props.onUpdatePageTitle(pageToSave)
    }

    setPage(pageToSave)
    setIsEditing(false)
    setToast({ position: 'bottom', content: <div>הדף <b>{title}</b> {_id ? 'נשמר' : 'נוצר'} בהצלחה.</div> })
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
    setToast({ position: 'bottom', content: <div>הדף <b>{page.title}</b> נמחק בהצלחה. <a href="/" onClick={cancelDelete}>בטל מחיקה</a></div> })
  }, [page])

  switch (props.status) {
    case 404:
      return <div className="results page">
        <h5 className="p-2">
          <p>הדף <span className="fw-bold">{title}</span> לא נמצא בספר הטלפונים.</p>
          <p>&nbsp;</p>
          {isGuestLogin && <p>יכול להיות שזה מפני שלא בוצעה <a href={`/`}>כניסה למערכת</a>.</p>}
        </h5>
      </div>

    default:
      return isEditing ? <PageEditor page={page} onCancel={cancelEditing} onSave={saveChanges} pushState={pushState} setToast={setToast}/> :
        <div className="p-2">
          <div className="card p-1 mb-3" key={page.title}>
            {isGuestLogin || <DeleteConfirmationModal pageTitle={title}
                                                            setModalVisible={setIsDeleteConfirmationVisible}
                                                            onDelete={deletePage}/>}
            <div className="card-body p-2">
              <div className="float-end d-flex">
                {isGuestLogin || <><div className="d-none d-md-block">
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
              <div>
                {tags && tags.map(t => <TagLink key={t} tag={t} pushState={pushState} kind="small"/>)}
              </div>
              <PageHtmlRenderer pushState={pushState} page={page} pages={pages} totalCount={totalCount} search={search} tags={tags} tag={tag}/>
            </div>
          </div>
        </div>
  }
}
