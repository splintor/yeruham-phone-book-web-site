import { IncomingMessage, ServerResponse } from 'http'
import { NextApiResponse } from 'next'
import { parseAuthCookies } from './cookies';

export async function sendResponse(response: NextApiResponse, fetchResponse: Response, logData: ReturnType<typeof getRequestLogData>) {
  console.info('sending response', logData)
  response.statusCode = fetchResponse.status
  response.setHeader('Content-Type', 'application/json')
  response.end(await fetchResponse.text())
}

export function sendUnsupportedMethodResponse(response: ServerResponse, message: string, logData: object) {
  console.error(message, logData)
  response.statusCode = 405
}

export function getRequestLogData(request: IncomingMessage) {
  const { url, headers: { host, 'x-forwarded-for': ip }, method } = request
  return { url, host, method, ip }
}

let allTags: string[];
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

export async function savePage(page) {
  const { auth } = parseAuthCookies()
  const res = await fetch(`/api/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `auth=${auth}` },
    body: JSON.stringify({ page })
  })
}
