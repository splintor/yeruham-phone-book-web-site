import React, { ReactElement } from 'react'
import siteInfo from '../site-info.json'

interface Props {
  width?: string;
  height?: string;
  className?: string;
}

export const Logo = (props: Props): ReactElement =>
  <img src="/logo.png" alt={siteInfo.siteTitle} title={`${siteInfo.siteTitle}\n${siteInfo.logoDescription}`} {...props} />
