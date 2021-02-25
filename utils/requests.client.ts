import { parseAuthCookies } from './cookies'

export async function searchForPages(search: string) {
  const { auth } = parseAuthCookies()
  if (search) {
    const res = await fetch(`/api/pages/search/${search}`, { headers: { Cookie: `auth=${auth}` } })
    if (res.ok) {
      return res.json()
    }
  }

  return null
}

export async function getTagPages(tag: string) {
  const { auth } = parseAuthCookies()
  if (tag) {
    const res = await fetch(`/api/pages/tag/${tag}`, { headers: { Cookie: `auth=${auth}` } })
    if (res.ok) {
      return res.json()
    }
  }

  return null
}
