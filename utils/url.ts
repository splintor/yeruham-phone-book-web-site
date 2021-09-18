import { ToastOptions } from '../components/App'
import { PageData } from "../types/PageData"
import { copyTextToClipboard } from './clipboard'

export const pageUrl = (title: string): string => '/' + title.replace(/ /g, '_')
export const getSearchUrl = (search: string): string => search ? `/search/${search}` : '/'
export const getTagUrl = (tag: string): string => tag ? `/tag/${tag}`  : '/'

export async function copyPageLink(page: PageData, search: string, tag: string, setToast: (toastOptions: ToastOptions) => void): Promise<void> {
  const url = page?.title ? pageUrl(page.title) : tag ? getTagUrl(tag) : search ? getSearchUrl(search) : '/'
  await copyTextToClipboard(location.origin + url.replace(/ /g, '_'))
  setToast({ content: 'כתובת הדף הועתקה.', position: 'bottom', timeout: 3_000 })
}
