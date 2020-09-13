import { parse } from 'cookie'

const authTitleKey = 'authTitle'
export const setAuthCookies = (auth: string, authTitle: string) => {
  document.cookie = `auth=${auth};path=/;max-age=2147483647`;
  if (auth && authTitle) {
    localStorage.setItem(authTitleKey, authTitle);
  } else {
    localStorage.removeItem(authTitleKey)
  }
}

export const parseAuthCookies = (): { auth?: string, authTitle?: string } => {
  const { auth } = parse(document.cookie || '')
  const authTitle = auth && localStorage.getItem(authTitleKey) || ''
  return { auth, authTitle }
}
