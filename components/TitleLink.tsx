import React, { MouseEventHandler, ReactElement } from 'react'
import { pageUrl } from '../utils/url'

export const TitleLink = ({ title, href, onClick }: { title: string, href?: string, onClick?: MouseEventHandler}): ReactElement =>
  <a className="titleLink" href={href || pageUrl(title)} onClick={onClick}>{title}</a>
