import { SearchResults } from '../types/AppProps'
import { PageHistoryEntry } from '../types/PageData'
import { parseAuthCookies } from './cookies'

export async function searchForPages(search: string): Promise<SearchResults | null> {
  const { auth } = parseAuthCookies()
  if (search) {
    const res = await fetch(`/api/pages/search/${search}`, { headers: { Cookie: `auth=${auth}` } })
    if (res.ok) {
      return res.json()
    }
  }

  return null
}

export async function getTagPages(tag: string): Promise<SearchResults | null> {
  const { auth } = parseAuthCookies()
  if (tag) {
    const res = await fetch(`/api/pages/tag/${tag}`, { headers: { Cookie: `auth=${auth}` } })
    if (res.ok) {
      return res.json()
    }
  }

  return null
}

export async function getPageHistory(pageId: string): Promise<PageHistoryEntry[]> {
  const { auth } = parseAuthCookies()
  const res = await fetch(`/api/pageHistory/${encodeURIComponent(pageId)}`, { headers: { Cookie: `auth=${auth}` } })
  if (res.ok) {
    return res.json()
  }
  return []
}
