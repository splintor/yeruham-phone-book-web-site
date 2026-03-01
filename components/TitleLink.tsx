import React, { MouseEventHandler, ReactElement } from 'react'
import { pageUrl } from '../utils/url'

function highlightTitle(title: string, search?: string): ReactElement | string {
  if (!search?.trim()) return title

  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = title.split(regex)

  if (parts.length === 1) return title

  return <>{parts.map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  )}</>
}

export const TitleLink = ({ title, href, onClick, className, search }: { title: string, href?: string, onClick?: MouseEventHandler, className?: string, search?: string }): ReactElement =>
  <a className={className} href={href || pageUrl(title)} onClick={onClick}>{highlightTitle(title, search)}</a>
