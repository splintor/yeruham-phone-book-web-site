import dynamic from 'next/dynamic'
import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { AppProps } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { savePage } from '../utils/api'
import { pageUrl } from '../utils/url'
import { deletedPageTitleKey, ToastOptions } from './App'
import { Modal } from './Modal'
import { PageHtmlRenderer } from './PageHtmlRenderer'
import { TagLink } from './TagLink'

const PageEditor = dynamic(() => import('./PageEditor'), { ssr: false })

interface PageContentProps extends Pick<AppProps, 'status' | 'page' | 'search' | 'tag' | 'pages' | 'newPage' | 'totalCount'> {
  pushState(url: string, state: Partial<AppProps>)
  onUpdatePageTitle(page: PageData)
  setToast(toastOptions: ToastOptions)
  isGuestLogin: boolean
}

export function PageContent({ search, tag, pushState, setToast, pages, totalCount, ...props }: PageContentProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [page, setPage] = useState(props.page)
  const { title, tags } = page

  useEffect(() => {
    if (!isEditing && props.newPage) {
      setIsEditing(true)
    }
  }, [props.newPage])

  useEffect(() => setPage(props.page), [props.page])

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
        <div className="results page">
          {props.isGuestLogin ||
          <div className="buttons">
            <button className="delete" onClick={() => setShowDeleteConfirmation(true)}>מחיקה</button>
            <button onClick={() => setIsEditing(true)}>עריכה</button>
          </div>}
          <Modal title={`מחיקת הדף ${title}`}
                 show={showDeleteConfirmation}
                 setShow={setShowDeleteConfirmation}
                 submitText="מחק את הדף"
                 onSubmit={deletePage}
          >
            האם ברצונך למחוק את הדף <b>{title}</b>?
          </Modal>
          <h1><a href={pageUrl(title)}>{title}</a></h1>
          <PageHtmlRenderer pushState={pushState} page={page} pages={pages} totalCount={totalCount} search={search} tags={tags} tag={tag}/>
          <div className="tags">
            {tags && tags.map(t => <TagLink key={t} tag={t} pushState={pushState} className="titleLink tag"/>)}
          </div>
        </div>
  }
}
