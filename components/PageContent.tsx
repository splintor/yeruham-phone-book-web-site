import dynamic from 'next/dynamic'
import React, { ReactElement, useEffect, useState } from 'react'
import { useKeyPress } from '../hooks/useKeyPress'
import { AppProps } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { savePage } from '../utils/api'
import { pageUrl } from '../utils/url'
import { editedPageCacheKey, ToastOptions } from './App'
import { LoginPage } from './LoginPage'
import { PageEditButtons } from './PageEditButtons'
import { PageHtmlRenderer } from './PageHtmlRenderer'
import { TagLink } from './TagLink'
import { TitleLink } from './TitleLink'
import { CopyToClipboard } from './CopyToClipboard'

const PageEditor = dynamic(() => import('./PageEditor'), { ssr: false })

interface PageContentProps extends Pick<AppProps, 'status' | 'page' | 'search' | 'tag' | 'pages' | 'totalCount'> {
  pushState(url: string, state: Partial<AppProps>): void
  onUpdatePageTitle(page: PageData): void
  setToast(toastOptions: ToastOptions): void
  isGuestLogin: boolean
  closePage(): void
  isEdited?: boolean
  isDeleteConfirmationVisible: boolean
}

export function PageContent({ search, tag, pushState, setToast, pages, totalCount, closePage, isGuestLogin, ...props }: PageContentProps): ReactElement {
  const [isEditing, setIsEditing] = useState(props.isEdited || Boolean(localStorage.getItem(editedPageCacheKey(props.page.title))))
  const escapePressed = useKeyPress('Escape')
  const [page, setPage] = useState(props.page)
  const { title, tags } = page

  useEffect(() => setPage(props.page), [props.page])

  const clearPageCache = (): void => localStorage.removeItem(editedPageCacheKey(props.page.title))

  if (escapePressed && !props.isDeleteConfirmationVisible) {
    if (isEditing) {
      cancelEditing(escapePressed)
    } else {
      closePage?.()
    }
  }

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
    clearPageCache()
    setToast({ position: 'bottom', content: <div>הדף <b>{title}</b> {_id ? 'נשמר' : 'נוצר'} בהצלחה.</div> })
  }

  function cancelEditing(e: React.MouseEvent | Event): void {
    e.preventDefault()
    clearPageCache()
    if (props.isEdited) {
      history.back()
    } else {
      setIsEditing(false)
    }
  }

  switch (props.status) {
    case 404:
      return isGuestLogin ? <LoginPage/> : <div className="results page">
        <h5 className="p-2">
          <p>הדף <span className="fw-bold">{title}</span> לא נמצא בספר הטלפונים.</p>
        </h5>
      </div>

    default:
      return isEditing ? <PageEditor page={page} onCancel={cancelEditing} onSave={saveChanges} pushState={pushState} setToast={setToast}/> :
        <div className="p-2">
          <div className="card p-1 mb-3" key={page.title}>
            <div className="card-body p-2">
              <PageEditButtons page={page}
                               isGuestLogin={isGuestLogin}
                               startEditing={() => setIsEditing(true)}
                               closePage={closePage}/>
              <h5 className="card-title">
                <TitleLink title={page.title} key={page.title}/>
                <CopyToClipboard page={page} search="" tag="" setToast={setToast} />
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
