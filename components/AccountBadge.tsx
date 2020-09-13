import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { parseAuthCookies, setAuthCookies } from '../utils/cookies'
import { TitleLink } from './TitleLink'

export function AccountBadge() {
  const [authTitle, setAuthTitle] = useState('')
  useEffect(() => {
    const { authTitle } = parseAuthCookies()
    setAuthTitle(authTitle)
  }, [])

  return authTitle && <div className="account">
    מחובר כ
    <TitleLink title={authTitle}/> (
    <Link href="/">
      <a onClick={() => setAuthCookies('', '')}>התנתק</a>
    </Link>
    )
  </div>
}
