import { IncomingMessage } from 'http'
import { NextApiRequest } from 'next'
import { parseAuthCookies } from './cookies'

const urlPrefix = `${process.env.WIX_PAGE_URL}/_functions`

function getRequestOptions(req: IncomingMessage) {
  const { auth } = parseAuthCookies(req)
  return { headers: { Authorization: auth } }
}

export const checkLogin = (req: IncomingMessage): Promise<Response> =>
  fetch(`${urlPrefix}/checkLogin`, getRequestOptions(req))

export const getPage = (req: IncomingMessage, titleOrOldName: string): Promise<Response> =>
  fetch(`${urlPrefix}/page/${encodeURI(titleOrOldName)}`, getRequestOptions(req))

export const searchPages = (req: IncomingMessage, search: string): Promise<Response> =>
  fetch(`${urlPrefix}/search/${encodeURI(search)}`, getRequestOptions(req))

export const getTagPages = (req: IncomingMessage, tag: string): Promise<Response> =>
  fetch(`${urlPrefix}/tag/${encodeURI(tag)}`, getRequestOptions(req))

export const getAllTags = (req: IncomingMessage): Promise<Response> =>
  fetch(`${urlPrefix}/tags`, getRequestOptions(req))

export const getAllPages = (req: IncomingMessage, updatedAfter: string, requestedBy: string): Promise<Response> =>
  fetch(`${urlPrefix}/pages?UpdatedAfter=${updatedAfter || ''}&RequestedBy=${requestedBy || ''}`, getRequestOptions(req))

export const savePage = (req: NextApiRequest): Promise<Response> =>
  fetch(`${urlPrefix}/page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: parseAuthCookies(req).auth },
    body: JSON.stringify(req.body),
  })

export const sendToLog = (req: NextApiRequest): Promise<Response> =>
  fetch(`${urlPrefix}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: parseAuthCookies(req).auth },
    body: JSON.stringify(req.body),
  })
