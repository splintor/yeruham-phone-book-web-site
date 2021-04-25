import React, { ReactElement } from 'react'
import { AppProps } from '../types/AppProps'
import { parseAuthCookies } from '../utils/cookies'
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

  return <div dangerouslySetInnerHTML={{ __html: props.page.html }} className={`page-html ${className}`} onClick={onContentClick}/>
}
