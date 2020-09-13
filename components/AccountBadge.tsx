import React, { useEffect, useState } from 'react';
import { parse } from 'cookie'
import Link from 'next/link';
import { TitleLink } from './TitleLink';

export function AccountBadge() {
  const [authTitle, setAuthTitle] = useState('')
  useEffect(() => {
    const { authTitle } = parse(document.cookie || '')
    setAuthTitle(authTitle)
  }, [])

  return authTitle && <div className="account">
    מחובר כ
    <TitleLink title={authTitle}/> (
    <Link href="/">
      <a onClick={() => document.cookie = 'auth=;path=/'}>התנתק</a>
    </Link>
    )
  </div>
}
