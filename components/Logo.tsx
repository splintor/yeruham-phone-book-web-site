import React, { ReactElement } from 'react'
import { siteTitle } from '../utils/consts'

interface Props {
  width?: string;
  height?: string;
  className?: string;
}

export const Logo = (props: Props): ReactElement =>
  <img src="/logo.png" alt={siteTitle} title={`${siteTitle}\nקרדיט על צילום הלוגו: ליאור אלמגור – www.fromycamera.com`} {...props} />
