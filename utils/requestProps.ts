import { IncomingMessage } from 'http'

export function getOrigin(req: IncomingMessage): string {
  const host = req.headers.host || 'localhost:3000'
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  return `${protocol}://${host}`
}

export function requestProps(req: IncomingMessage): { origin: string, url: string } {
  const origin = getOrigin(req)
  return {
    origin,
    url: decodeURI(origin + req.url),
  }
}
