import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { diffWords } from 'diff'
import { PageData, PageHistoryEntry } from '../types/PageData'
import { getPageHistory } from '../utils/requests.client'

function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}

function DiffView({ oldHtml, newHtml }: { oldHtml: string, newHtml: string }): ReactElement {
  const oldText = stripHtml(oldHtml)
  const newText = stripHtml(newHtml)
  const parts = diffWords(oldText, newText)

  return <div className="diff-view" dir="rtl">
    {parts.map((part, i) => {
      const className = part.added ? 'diff-added' : part.removed ? 'diff-removed' : 'diff-unchanged'
      return <span key={i} className={className}>{part.value}</span>
    })}
  </div>
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toLocaleDateString() === today.toLocaleDateString()) {
    return `היום ב-${date.toLocaleTimeString()}`
  }
  if (date.toLocaleDateString() === yesterday.toLocaleDateString()) {
    return `אתמול ב-${date.toLocaleTimeString()}`
  }
  return date.toLocaleString()
}

function HistoryEntry({ entry, newerHtml, newerTitle, newerTags, isOldest }: {
  entry: PageHistoryEntry
  newerHtml?: string
  newerTitle?: string
  newerTags?: string[]
  isOldest: boolean
}): ReactElement {
  const [expanded, setExpanded] = useState(false)
  const titleChanged = newerTitle !== undefined && entry.oldTitle !== newerTitle
  const tagsChanged = newerTags !== undefined && (entry.oldTags || []).join(',') !== (newerTags || []).join(',')

  return <div className="border rounded p-2 mb-2">
    <div className="d-flex justify-content-between align-items-center" role="button" onClick={() => setExpanded(!expanded)}>
      <div>
        <strong>{formatDate(entry._createdDate)}</strong>
        <span className="text-muted me-2"> — {entry.changedBy}</span>
      </div>
      <span>{expanded ? '▲' : '▼'}</span>
    </div>
    {expanded && <div className="mt-2">
      {titleChanged && <div className="mb-1">
        <small className="text-muted">כותרת: </small>
        <span className="diff-removed">{entry.oldTitle}</span>
        {' → '}
        <span className="diff-added">{newerTitle}</span>
      </div>}
      {tagsChanged && <div className="mb-1">
        <small className="text-muted">קטגוריות: </small>
        <span className="diff-removed">{(entry.oldTags || []).join(', ') || '(ללא)'}</span>
        {' → '}
        <span className="diff-added">{(newerTags || []).join(', ') || '(ללא)'}</span>
      </div>}
      {isOldest
        ? <div className="text-muted fst-italic">זוהי הגרסה השמורה הראשונה</div>
        : newerHtml !== undefined && <DiffView oldHtml={entry.oldHtml} newHtml={newerHtml}/>
      }
    </div>}
  </div>
}

export function PageHistoryModal(): ReactElement {
  const modalRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState<PageData | null>(null)
  const [history, setHistory] = useState<PageHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    const onShow = (event: Event) => {
      const button = (event as unknown as { relatedTarget: HTMLElement }).relatedTarget
      const pageData = JSON.parse(button.getAttribute('data-bs-page')!) as PageData
      setPage(pageData)
      setLoading(true)
      setError(null)
      setHistory([])

      getPageHistory(pageData._id!).then(entries => {
        setHistory(entries)
        setLoading(false)
      }).catch(() => {
        setError('שגיאה בטעינת ההיסטוריה')
        setLoading(false)
      })
    }

    const onHidden = () => {
      setPage(null)
      setHistory([])
      setError(null)
    }

    modal.addEventListener('show.bs.modal', onShow)
    modal.addEventListener('hidden.bs.modal', onHidden)
    return () => {
      modal.removeEventListener('show.bs.modal', onShow)
      modal.removeEventListener('hidden.bs.modal', onHidden)
    }
  }, [])

  return <div className="modal fade" id="pageHistory" ref={modalRef} tabIndex={-1}
              aria-labelledby="pageHistoryLabel" aria-hidden="true">
    <div className="modal-dialog modal-lg modal-dialog-scrollable">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title" id="pageHistoryLabel">היסטוריית הדף {page?.title && <b>{page.title}</b>}</h5>
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="סגירה"/>
        </div>
        <div className="modal-body">
          {loading && <div className="d-flex justify-content-center text-primary my-4">
            <span className="spinner-border spinner-border-sm me-2" role="status"/>
            טוען היסטוריה...
          </div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && !error && history.length === 0 && <div className="text-muted text-center my-4">
            אין היסטוריה שמורה לדף זה
          </div>}
          {!loading && !error && history.length > 0 && <>
            <div className="text-muted mb-2">
              <small>גרסה נוכחית — {page?._updatedDate && formatDate(page._updatedDate)}</small>
            </div>
            {history.map((entry, i) => {
              const newerHtml = i === 0 ? page?.html : history[i - 1].oldHtml
              const newerTitle = i === 0 ? page?.title : history[i - 1].oldTitle
              const newerTags = i === 0 ? page?.tags : history[i - 1].oldTags
              const isOldest = i === history.length - 1

              return <HistoryEntry
                key={entry._id}
                entry={entry}
                newerHtml={newerHtml}
                newerTitle={newerTitle}
                newerTags={newerTags}
                isOldest={isOldest}
              />
            })}
          </>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">סגירה</button>
        </div>
      </div>
    </div>
  </div>
}
