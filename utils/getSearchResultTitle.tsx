import React, { ReactNode } from 'react'
import { PageData } from '../types/PageData'

export function getSearchResultTitle(pages: PageData[], tags: string[], totalCount: number, search: string, tag: string, isGuestLogin: boolean): ReactNode {
  const pagesCount = pages && pages.length || 0
  const tagsCount = tags && tags.length || 0

  switch (pagesCount) {
    case 0:
      switch (tagsCount) {
        case 0:
          return <div>
            <p>לא נמצאו דפים שמכילים <b>{search || tag}</b>.</p>
            <p>&nbsp;</p>
            {isGuestLogin
              ? <p>יכול להיות שזה מפני ש  <a href={`/`}>אינך מחובר/ת</a>.</p>
              : <p>אפשר לחפש משהו אחר או <a href={`/new_page?initialTitle=${search}`}>להוסיף דף חדש</a>.</p>}
          </div>
        case 1:
          return 'נמצאה קטגוריה אחת:'
        default:
          return `נמצאו ${tagsCount} קטגוריות:`
      }

    case 1:
      switch (tagsCount) {
        case 0:
          return 'נמצא דף אחד:'
        case 1:
          return 'נמצאו קטגוריה אחת ודף אחד:'
        default:
          return `נמצאו ${tagsCount} קטגוריות ודף אחד:`
      }

    default:
      const wrap = totalCount > pagesCount
        ? (s: string) => <><span>{`${s}. `}</span><span className="text-nowrap">{`מציג את ${pagesCount} הדפים הראשונים`}:</span></>
        : (s: string) => s + ':'
      const pageCount = totalCount ?? pagesCount
      switch (tagsCount) {
        case 0:
          return wrap(`נמצאו ${pageCount} דפים`)
        case 1:
          return wrap(`נמצאו קטגוריה אחת ו-${pageCount} דפים`)
        default:
          return wrap(`נמצאו ${tagsCount} קטגוריות ו-${pageCount} דפים`)
      }
  }
}
