import { parse } from 'cookie'

export const setAuthCookies = (auth: string, authTitle: string) => {
  document.cookie = `auth=${auth};path=/;max-age=2147483647`;
  document.cookie = `authTitle=${authTitle};path=/;max-age=2147483647`;
}

export const parseAuthCookies = (): { auth?: string, authTitle?: string } =>
  parse(document.cookie || '')
