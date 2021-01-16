import dynamic from 'next/dynamic'
import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { AppProps } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { savePage } from '../utils/api'
import { pageUrl } from '../utils/url'
import { deletedPageTitleKey, ToastOptions } from './App'
import { Modal } from './Modal'

const PageEditor = dynamic(() => import('./PageEditor'))

interface PageContentProps extends Pick<AppProps, 'status' | 'page' | 'search' | 'tag' | 'pages' | 'newPage' | 'totalCount'> {
  pushState(url: string, state: Partial<AppProps>)
  setToast(toastOptions: ToastOptions)
}

export function PageContent({ search, tag, pushState, setToast, pages, totalCount, ...props }: PageContentProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [page, setPage] = useState(props.page)
  const { html, title, tags } = page
  const backUrl = pages && (search ? `/search/${search}` : tag && `/tag/${tag}`) || null

  useEffect(() => {
    if (!isEditing && props.newPage) {
      setIsEditing(true)
    }
  }, [props.newPage])

  const saveChanges = async (pageToSave: PageData) => {
    await savePage(pageToSave)
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

    if (backUrl && pages?.length && (pages.length > 1 || pages[0].title !== page.title)) {
      sessionStorage.setItem(deletedPageTitleKey, page.title)
      history.back()
    } else {
      pushState('/', {})
    }
    setToast({ content: <div>הדף<b>{page.title}</b> נמחק בהצלחה.<a className="toast-button" href="/" onClick={cancelDelete}>בטל מחיקה</a></div> })
  }, [page])

  switch (props.status) {
    case 404:
      return <div className="results page">
        <div className="notFound">הדף <span className="searchedTitle">{title}</span> לא נמצא בספר הטלפונים.</div>
      </div>

    default:
      return isEditing ? <PageEditor page={page} onCancel={cancelEditing} onSave={saveChanges}/> :
        <div className="results page">
          <div className="buttons">
            <button className="delete" onClick={() => setShowDeleteConfirmation(true)}>מחיקה</button>
            <button onClick={() => setIsEditing(true)}>עריכה</button>
          </div>
          <Modal title={`מחיקת הדף ${title}`}
                 show={showDeleteConfirmation}
                 setShow={setShowDeleteConfirmation}
                 submitText="מחק את הדף"
                 onSubmit={deletePage}
          >
            האם ברצונך למחוק את הדף <b>{title}</b>?
          </Modal>
          <h1>
            {backUrl && <a className="backButton" href={backUrl} onClick={e => {
              e.preventDefault()
              history.back()
            }}>&#8658;</a>}
            <a href={pageUrl(title)}>{title}</a>
          </h1>
          <div dangerouslySetInnerHTML={{ __html: html }}/>
          <div className="tags">
            {tags && tags.map(t => <a className="titleLink tag" key={t} href={`/tag/${t}`}>{t}</a>)}
          </div>
        </div>
  }
}
