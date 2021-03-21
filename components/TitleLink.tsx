import React, { MouseEventHandler, ReactElement } from 'react'
import { pageUrl } from '../utils/url'

export const TitleLink = ({ title, href, onClick, className }: { title: string, href?: string, onClick?: MouseEventHandler, className?: string }): ReactElement =>
  <a className={className} href={href || pageUrl(title)} onClick={onClick}>{title}</a>
