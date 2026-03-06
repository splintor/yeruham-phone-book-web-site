import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { PageData, PageHistoryEntry } from '../types/PageData'
import { savePage } from '../utils/api'
import { getPageHistory } from '../utils/requests.client'

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

function VersionEntry({ label, author, html, page, onRestore }: {
  label: string
  author?: string
  html: string
  page?: PageData
  onRestore?(page: PageData): void
}): ReactElement {
  const [expanded, setExpanded] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const canRestore = page && onRestore

  async function restore() {
    if (!canRestore) return
    setRestoring(true)
    const restoredPage = { ...page, html }
    const response = await savePage(restoredPage)
    if (response.ok) {
      onRestore(restoredPage)
    }
    setRestoring(false)
  }

  return <div className="border rounded p-2 mb-2">
    <div className="d-flex justify-content-between align-items-center" role="button" onClick={() => setExpanded(!expanded)}>
      <div><strong>{label}</strong>{author && <span className="text-muted"> — {author}</span>}</div>
      <span>{expanded ? '▲' : '▼'}</span>
    </div>
    {expanded && <div className="mt-2">
      <div className="page-html history-preview border rounded p-2 mb-2" dir="rtl"
           dangerouslySetInnerHTML={{ __html: html }}/>
      {canRestore && <button className="btn btn-sm btn-outline-primary" disabled={restoring} onClick={restore}>
        {restoring ? 'משחזר...' : 'שחזר גרסה זו'}
      </button>}
    </div>}
  </div>
}

interface PageHistoryModalProps {
  onRestore?(page: PageData): void
}

export function PageHistoryModal({ onRestore }: PageHistoryModalProps): ReactElement {
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

  function handleRestore(restoredPage: PageData) {
    onRestore?.(restoredPage)
    // Close the modal via Bootstrap API
    const modal = modalRef.current
    if (modal) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bsModal = (window as any).bootstrap?.Modal.getInstance(modal)
      bsModal?.hide()
    }
  }

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
          {!loading && !error && history.length > 0 && page && <>
            <VersionEntry
              key="current"
              label={`גרסה נוכחית — ${formatDate(history[0]._createdDate)}`}
              author={history[0].changedBy}
              html={page.html}
            />
            {history.map((entry, i) => {
              const nextEntry = history[i + 1]
              const dateLabel = nextEntry ? formatDate(nextEntry._createdDate) : 'גרסה ראשונה'
              return <VersionEntry
                key={entry._id}
                label={dateLabel}
                author={nextEntry?.changedBy || entry.changedBy}
                html={entry.oldHtml}
                page={page}
                onRestore={handleRestore}
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
