import { parse } from 'cookie'
import { IncomingMessage } from 'http'

export const guestAuthString = 'guest'
const authTitleKey = 'authTitle'
const authTitleIsNewKey = 'authTitleIsNew'
export function setAuthCookies(auth: string, authTitle: string): void {
  document.cookie = [`auth=${auth}`, 'path=/', 'max-age=2147483647'].join(';')
  if (auth && authTitle) {
    localStorage.setItem(authTitleKey, authTitle)
    localStorage.setItem(authTitleIsNewKey, '1')
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
  isGuestLogin: boolean
}

export function parseAuthCookies(request?: IncomingMessage): AuthData {
  const { auth } = parse((request ? request.headers.cookie : document.cookie) || '')
  const authTitle = !request && auth && localStorage.getItem(authTitleKey) || ''
  return { auth, authTitle, isGuestLogin: auth === guestAuthString  }
}
