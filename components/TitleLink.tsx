import React from 'react'
import Link from 'next/link'

export const TitleLink = ({ title }) =>
  <Link href={`/${title.replace(/ /g, '_')}`}>
    <a>{title}</a>
  </Link>
