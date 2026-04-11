import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { PageData, PageHistoryEntry } from '../types/PageData'
import { savePage } from '../utils/api'
import { getPageHistory } from '../utils/requests.client'

const rtf = new Intl.RelativeTimeFormat('he', { numeric: 'auto' })

function formatRelativeDate(dateStr: string): string {
  const diffMs = new Date(dateStr).getTime() - Date.now()
  const diffSeconds = Math.round(diffMs / 1000)
  const diffMinutes = Math.round(diffSeconds / 60)
  const diffHours = Math.round(diffMinutes / 60)
  const diffDays = Math.round(diffHours / 24)
  const diffWeeks = Math.round(diffDays / 7)
  const diffMonths = Math.round(diffDays / 30.5)
  const diffYears = Math.round(diffDays / 365)

  if (Math.abs(diffSeconds) < 60) return rtf.format(diffSeconds, 'second')
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute')
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day')
  if (Math.abs(diffWeeks) < 5) return rtf.format(diffWeeks, 'week')
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month')
  return rtf.format(diffYears, 'year')
}

function formatExactDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('he-IL')
}

function VersionEntry({ label, date, author, html, page, onRestore }: {
  label?: string
  date?: string
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
      <div>
        {label && <strong>{label}</strong>}
        {date && <span className="text-muted" title={formatExactDate(date)}>{label ? ' — ' : ''}{formatRelativeDate(date)}</span>}
        {author && <span className="text-muted"> — {author}</span>}
      </div>
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
  const [pageCreatedBy, setPageCreatedBy] = useState<string | undefined>(undefined)
  const [pageCreatedDate, setPageCreatedDate] = useState<string | undefined>(undefined)
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
      setPageCreatedBy(undefined)
      setPageCreatedDate(undefined)

      getPageHistory(pageData._id!).then(({ entries, createdBy, createdDate }) => {
        setHistory(entries)
        setPageCreatedBy(createdBy)
        setPageCreatedDate(createdDate)
        setLoading(false)
      }).catch(() => {
        setError('שגיאה בטעינת ההיסטוריה')
        setLoading(false)
      })
    }

    const onHidden = () => {
      setPage(null)
      setHistory([])
      setPageCreatedBy(undefined)
      setPageCreatedDate(undefined)
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
          <h5 className="modal-title" id="pageHistoryLabel">היסטוריית הדף {page?.title && <b>{page.title}</b>}{!loading && !error && ` (${history.length === 0 ? 'גרסה אחת' : `${history.length + 1} גרסאות`})`}</h5>
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="סגירה"/>
        </div>
        <div className="modal-body">
          {loading && <div className="d-flex justify-content-center text-primary my-4">
            <span className="spinner-border spinner-border-sm me-2" role="status"/>
            טוען היסטוריה...
          </div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && !error && page && <>
            {history.length > 0 ? <>
              <VersionEntry
                key="current"
                label="גרסה נוכחית"
                date={history[0]._createdDate}
                author={history[0].changedBy}
                html={page.html}
              />
              {history.map((entry, i) => {
                const nextEntry = history[i + 1]
                return <VersionEntry
                  key={entry._id}
                  label={nextEntry ? undefined : 'גרסה ראשונה'}
                  date={nextEntry ? nextEntry._createdDate : entry._createdDate}
                  author={nextEntry?.changedBy || entry.changedBy}
                  html={entry.oldHtml}
                  page={page}
                  onRestore={handleRestore}
                />
              })}
            </> : <VersionEntry
              key="current-only"
              label="גרסה נוכחית"
              date={pageCreatedDate || page._createdDate}
              author={pageCreatedBy}
              html={page.html}
            />}
          </>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">סגירה</button>
        </div>
      </div>
    </div>
  </div>
}
