import { IncomingMessage } from 'http'
import { parseAuthCookies } from './cookies'
import fetch from 'isomorphic-fetch'

const urlPrefix = `${process.env.WIX_PAGE_URL}/_functions`

function getRequestOptions(req: IncomingMessage) {
  const { auth } = parseAuthCookies(req)
  return { headers: { Authorization: auth } }
}

export const login = async (phoneNumber: string) =>
  fetch(`${urlPrefix}/login/${phoneNumber}`)

export const checkLogin = async (req: IncomingMessage) =>
  fetch(`${urlPrefix}/checkLogin`, getRequestOptions(req))

export const getPage = async (req: IncomingMessage, titleOrOldName: string) =>
  fetch(`${urlPrefix}/page/${encodeURI(titleOrOldName)}`, getRequestOptions(req))

export const searchPages = async (req: IncomingMessage, search: string) =>
  fetch(`${urlPrefix}/search/${encodeURI(search)}`, getRequestOptions(req))

export const getTagPages = async (req: IncomingMessage, tag: string) =>
  fetch(`${urlPrefix}/tag/${encodeURI(tag)}`, getRequestOptions(req))

export const updatePage = async (req: IncomingMessage, id: string, newTitle: string, newHTML: string, newTags: string[]) =>
  fetch(`${urlPrefix}/page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: parseAuthCookies(req).auth },
    body: JSON.stringify({ id, newTitle, newHTML, newTags }),
  })
