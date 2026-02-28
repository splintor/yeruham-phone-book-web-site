import { parse } from 'cookie'
import { IncomingMessage } from 'http'

const authTitleKey = 'authTitle'
const authTitleIsNewKey = 'authTitleIsNew'
export function setAuthCookies(auth: string, authTitle: string, markAsNew = true): void {
  document.cookie = [`auth=${auth}`, 'path=/', 'max-age=2147483647'].join(';')
  if (auth && authTitle) {
    localStorage.setItem(authTitleKey, authTitle)
    if (markAsNew) {
      localStorage.setItem(authTitleIsNewKey, '1')
    }
  } else {
    localStorage.removeItem(authTitleKey)
  }
}

export function isAuthTitleNew(): boolean {
  if (localStorage.getItem(authTitleIsNewKey) === '1') {
    localStorage.removeItem(authTitleIsNewKey)
    return true
  }

  return false
}

export interface AuthData {
  auth: string
  authTitle: string
}

export function parseAuthCookies(request?: IncomingMessage): AuthData {
  const { auth = '' } = parse((request ? request.headers.cookie : document.cookie) || '')
  const authTitle = !request && auth && localStorage.getItem(authTitleKey) || ''
  return { auth, authTitle }
}
