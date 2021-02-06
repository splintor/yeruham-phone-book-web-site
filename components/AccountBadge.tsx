import React, { ReactElement} from 'react'
import Link from 'next/link'
import { setAuthCookies } from '../utils/cookies'
import { logToGTM } from './App'
import { TitleLink } from './TitleLink'

interface AccountBadgeProps {
  showWelcome: boolean
  authTitle: string
  isGuestLogin: boolean
}
export function AccountBadge({ authTitle, isGuestLogin, showWelcome }: AccountBadgeProps): ReactElement {
  return authTitle && <div className="account">
    {showWelcome || isGuestLogin || <button onClick={() => location.href = '/new_page'}>הוסף דף חדש</button>}{' '}
    מחובר כ
    {isGuestLogin ? <b>{authTitle}</b> : <TitleLink title={authTitle}/>} (
    <Link href="/">
      <a onClick={() => {
        setAuthCookies('', '')
        logToGTM({ event: 'logout', authTitle })
      }}>התנתק</a>
    </Link>
    )
  </div>
}
