import { IncomingMessage, ServerResponse } from 'http'
import { NextApiResponse } from 'next'

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
