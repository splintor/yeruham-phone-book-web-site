import React, { MouseEventHandler, ReactElement } from 'react'
import { pageUrl } from '../utils/url'

export const TitleLink = ({ title, onClick }: { title: string, onClick?: MouseEventHandler}): ReactElement =>
  <a className="titleLink" href={pageUrl(title)} onClick={onClick}>{title}</a>
