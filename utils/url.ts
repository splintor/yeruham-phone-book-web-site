import { useEffect, useState } from 'react'
import { ToastOptions } from '../components/App'
import { PageData } from "../types/PageData"
import { copyTextToClipboard } from './clipboard'

export const pageUrl = (title: string): string => '/' + title.replace(/ /g, '_')
export const getSearchUrl = (search: string): string => search ? `/search/${search}` : '/'
export const getTagUrl = (tag: string): string => tag ? `/tag/${tag}`  : '/'

export async function copyPageLink(page: PageData, search: string, tag: string, setToast: (toastOptions: ToastOptions) => void): Promise<void> {
  const url = page?.title ? pageUrl(page.title) : tag ? getTagUrl(tag) : search ? getSearchUrl(search) : '/'
  await copyTextToClipboard(location.origin + url.replace(/ /g, '_').replace(/"/g, '\u201D'))
  setToast({ content: 'כתובת הדף הועתקה.', position: 'bottom', timeout: 3_000 })
}

export function useHashAuth(): string {
  const [hashAuth, setHashAuth] = useState<string>()
  useEffect(() => {
    const [, hashAuth] = location.hash.split('#auth:')
    if (hashAuth) {
      setHashAuth(hashAuth)
    }
  }, [])

  return hashAuth
}

// https://stackoverflow.com/a/5298684/46635
export const clearHashAuth = (): void =>
  history.replaceState("", document.title, window.location.pathname + window.location.search)
