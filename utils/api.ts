import { IncomingMessage, ServerResponse } from 'http'

export function sendJson(response: ServerResponse, json: object, message: string, logData: object) {
  console.info(message, logData)
  response.statusCode = 200
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(json))
}

export function sendUnauthorizedResponse(response: ServerResponse, message: string, logData: object) {
  console.error(message, logData)
  response.statusCode = 401
}

export function sendNotFoundResponse(response: ServerResponse, message: string, logData: object) {
  console.error(message, logData)
  response.statusCode = 404
}

export function sendUnsupportedMethodResponse(response: ServerResponse, message: string, logData: object) {
  console.error(message, logData)
  response.statusCode = 405
}

export function getRequestLogData(request: IncomingMessage) {
  const { url, headers: { host, 'fastly-client-ip': ip }, method } = request
  return { url, host, method, ip }
}
