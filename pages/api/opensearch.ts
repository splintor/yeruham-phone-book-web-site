import { NextApiRequest, NextApiResponse } from 'next'
import absoluteUrl from 'next-absolute-url'
import siteInfo from '../../site-info.json'

export default async function opensearch(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const { origin } = absoluteUrl(request)
  response.setHeader('Content-Type', 'application/xml')
  response.end(`<OpenSearchDescription
  xmlns="http://a9.com/-/spec/opensearch/1.1/"
  xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>${siteInfo.siteTitle}</ShortName>
  <Description>חיפוש מהיר ב${siteInfo.siteTitle}</Description>
  <Url type="text/html" template="${origin}/search/{searchTerms}"/>
  <Url type="application/x-suggestions+json" rel="suggestions" method="GET" template="${origin}/search-suggestions/{searchTerms}" />
</OpenSearchDescription>`)
}
