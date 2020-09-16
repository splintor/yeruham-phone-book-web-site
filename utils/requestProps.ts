import { IncomingMessage } from 'http';
import absoluteUrl from 'next-absolute-url/index';

export function requestProps(req: IncomingMessage) {
  const { origin } = absoluteUrl(req)
  return {
    origin,
    url: decodeURI(origin + req.url),
  }
}
