import { ReactElement } from 'react'
import { AppProps } from '../types/AppProps'
import { getTagPages } from '../utils/requests.client'

interface TagLinkProps {
  pushState(url: string, state: Partial<AppProps>)
  className?: string
  tag: string
}

export const TagLink = ({ tag, ...props }: TagLinkProps): ReactElement => {
  const onTagClick = async e => {
    e.preventDefault()
    const { href } = e.target
    const { pages } = await getTagPages(href.replace(location.origin + '/tag/', ''))
    if (pages) {
      props.pushState(`/tag/${tag}`, { pages, totalCount: pages.length, tag })
    } else {
      location.href = href
    }
  }

  return <a className={props.className} href={`/tag/${tag}`} onClick={onTagClick}>{tag}</a>
}
