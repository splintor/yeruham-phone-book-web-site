import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http'
import { NextApiResponse } from 'next'
import { PageData } from '../types/PageData'
import { parseAuthCookies } from './cookies'

export async function sendResponse(response: NextApiResponse, fetchResponse: Response): Promise<void> {
  response.statusCode = fetchResponse.status
  response.setHeader('Content-Type', 'application/json')
  response.end(await fetchResponse.text())
}

export function sendUnsupportedMethodResponse(response: ServerResponse, message: string, logData: Record<string, unknown>): void {
  console.error(message, logData)
  response.statusCode = 405
}

export function getRequestLogData(request: IncomingMessage):
  Pick<IncomingMessage, 'url' | 'method'> & { ip: IncomingHttpHeaders['ip'], host: IncomingHttpHeaders['host']  } {
  const { url, headers: { host, 'x-forwarded-for': ip }, method } = request
  return { url, host, method, ip }
}

let allTags: string[]
export async function getAllTags(force = false): Promise<string[]> {
  if (!allTags || force) {
    const { auth } = parseAuthCookies()
    if (auth) {
      const res = await fetch(`/api/tags`, { headers: { Cookie: `auth=${auth}` } })
      if (res.ok) {
        allTags = (await res.json()).tags.sort()
      }
    }
  }

  return allTags
}

export async function savePage(page: PageData): Promise<void> {
  const { auth } = parseAuthCookies()
  await fetch(`/api/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `auth=${auth}` },
    body: JSON.stringify({ page })
  })
}
