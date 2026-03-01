import React, { ReactElement } from 'react'
import { AppProps } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { parseAuthCookies } from '../utils/cookies'
import { highlightSearch } from '../utils/highlight-search'
import { pageUrl } from '../utils/url'

interface PageHtmlRendererProps extends Pick<AppProps, 'page' | 'search' | 'tags' | 'tag' | 'pages' | 'newPage' | 'totalCount'> {
  pushState(url: string, state: Partial<AppProps>)
  className?: string
}

async function getPage(title: string) {
  const { auth } = parseAuthCookies()
  if (title) {
    const res = await fetch(`/api/page/${title}`, { headers: { Cookie: `auth=${auth}` } })
    if (res.ok) {
      return res.json()
    }
  }

  return null
}

function enrichHtml({ html }: PageData) {
  let startIndex = 0
  while (true) {
    const match = html.substr(startIndex).match(/([\d-+]{8,}|\*\d{3,}|\d{3,}\*)([^"/p\d])/)
    if (!match) {
      return html
    }

    const matchStr = match[1]
    const matchIndex = match.index!
    startIndex += matchIndex
    const preMatchStr = html.substr(0, startIndex)
    const openLinkIndex = preMatchStr.lastIndexOf('<a ')
    const closeLinkIndex = preMatchStr.lastIndexOf('</a>')
    if (openLinkIndex === -1 || closeLinkIndex > openLinkIndex) {
      const whatsappNumber = matchStr.replaceAll('-', '').replace(/^0/, '972')
      const whatsappLink = whatsappNumber.startsWith('9725') ? ` <a href="https://wa.me/${whatsappNumber}"><img src="/whatsapp.svg"></a>` : ''
      const replacedStr = `<a href="tel:${matchStr}">${matchStr}</a>${whatsappLink}`
      html = preMatchStr + replacedStr + html.substr(startIndex + matchStr.length)
      startIndex += replacedStr.length
    } else {
      startIndex += matchStr.length
    }
  }
}

export const PageHtmlRenderer = ({ pushState, className, ...props}: PageHtmlRendererProps): ReactElement => {
  const onContentClick = async e => {
    const { tagName, target, href } = e.target
    if (tagName === 'A' && !target && href.indexOf(location.origin) === 0) {
      e.preventDefault()
      const page = await getPage(href.replace(location.origin + '/', ''))
      if (page) {
        const { pages, totalCount, tags, tag, search } = props
        pushState(pageUrl(page.title), { page, pages, totalCount, tags, tag, search })
      } else {
        location.href = href
      }
    }
  }

  return <div dangerouslySetInnerHTML={{ __html: highlightSearch(enrichHtml(props.page!), props.search) }} className={`page-html ${className}`} onClick={onContentClick}/>
}
