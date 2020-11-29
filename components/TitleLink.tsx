import React, { MouseEventHandler } from 'react'
import { pageUrl } from '../utils/url'

export const TitleLink = ({ title, onClick }: { title: string, onClick?: MouseEventHandler}) =>
  <a className="titleLink" href={`/${pageUrl(title)}`} onClick={onClick}>{title}</a>
