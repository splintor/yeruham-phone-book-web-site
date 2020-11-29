import { parse } from 'cookie'
import { IncomingMessage } from 'http'

const authTitleKey = 'authTitle'
export const setAuthCookies = (auth: string, authTitle: string): void => {
  document.cookie = [`auth=${auth}`, 'path=/', 'max-age=2147483647'].join(';')
  if (auth && authTitle) {
    localStorage.setItem(authTitleKey, authTitle)
  } else {
    localStorage.removeItem(authTitleKey)
  }
}

export const parseAuthCookies = (request?: IncomingMessage): { auth?: string, authTitle?: string } => {
  const { auth } = parse((request ? request.headers.cookie : document.cookie) || '')
  const authTitle = !request && auth && localStorage.getItem(authTitleKey) || ''
  return { auth, authTitle }
}
