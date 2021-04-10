import { ReactElement } from 'react'
import { AppProps } from '../types/AppProps'
import { publicTagName } from '../utils/consts'
import { getTagPages } from '../utils/requests.client'
import { getTagUrl } from '../utils/url'

interface TagLinkProps {
  pushState(url: string, state: Partial<AppProps>)
  kind: 'title' | 'small'
  className?: string
  tag: string
}

const classNames = {
  title: 'bg-primary link-light',
  titlePublic: 'bg-success link-light',
  small: 'border border-primary link-primary',
  smallPublic: 'border border-success link-success',
}

export const TagLink = ({ tag, kind, ...props }: TagLinkProps): ReactElement => {
  const kindType = tag === publicTagName ? `${kind}Public` : kind
  const onTagClick = async e => {
    e.preventDefault()
    const { href } = e.target
    const { pages } = await getTagPages(href.replace(location.origin + '/tag/', ''))
    if (pages) {
      props.pushState(getTagUrl(tag), { pages, totalCount: pages.length, tag })
    } else {
      location.href = href
    }
  }

  return <a className={'badge rounded-pill mb-2 me-1 text-decoration-none ' + classNames[kindType]}
            href={`/tag/${tag}`}
            onClick={onTagClick}>
    {tag}
  </a>
}
