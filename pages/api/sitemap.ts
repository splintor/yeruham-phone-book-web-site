import { NextApiRequest, NextApiResponse } from 'next'
import { SitemapStream, streamToPromise } from 'sitemap'
import { publicTagName } from '../../utils/consts'
import { getTagPages } from '../../utils/data-layer'
import { pageUrl } from '../../utils/url'

export default async (request: NextApiRequest, response: NextApiResponse): Promise<void> => {
  const smStream = new SitemapStream({ hostname: 'https://yeruham-phone-book.vercel.app' })
  smStream.write({ url: '/' })

  const { pages } = await (await getTagPages(request, publicTagName)).json()
  pages.forEach(page => smStream.write({ url: pageUrl(page.title), lastmod: page._updatedDate }))
  smStream.end()

  const sitemap = await streamToPromise(smStream)
  response.setHeader('Content-Type', 'application/xml')
  response.end(sitemap.toString())
}
