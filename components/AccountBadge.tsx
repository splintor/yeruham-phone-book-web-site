import React, { useEffect, useState } from 'react';
import { parse } from 'cookie'
import Link from 'next/link';

export function AccountBadge() {
  const [authTitle, setAuthTitle] = useState('')
  useEffect(() => {
    const { authTitle } = parse(document.cookie || '')
    setAuthTitle(authTitle)
  }, [])

  return authTitle && <div className="account">
    מחובר כ
    <Link href={`/${authTitle.replace(/ /g, '_')}`}>
      <a>{authTitle}</a>
    </Link> (
    <Link href="/">
      <a onClick={() => document.cookie = 'auth=;path=/'}>התנתק</a>
    </Link>
    )
  </div>
}
