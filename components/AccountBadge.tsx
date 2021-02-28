import React, { ReactElement} from 'react'
import Link from 'next/link'
import { setAuthCookies } from '../utils/cookies'
import { logToGTM } from '../utils/tag-manager'
import { TitleLink } from './TitleLink'

interface AccountBadgeProps {
  showWelcome: boolean
  authTitle: string
  isNewPage: boolean
}

export function AccountBadge({ authTitle, showWelcome, isNewPage }: AccountBadgeProps): ReactElement {
  const isGuestLogin = !authTitle
  return <div className="account">
    {showWelcome || isGuestLogin || isNewPage || <button onClick={() => location.href = '/new_page'}>הוספת דף חדש</button>}{' '}
    {authTitle ? <TitleLink title={authTitle}/> : <b>אורח/ת</b>} (
    <Link href="/">
      <a className="nav-link" onClick={() => {
        setAuthCookies('', '')
        logToGTM({ event: 'logout', authTitle })
      }}>{isGuestLogin ? 'כניסה' : 'יציאה'}</a>
    </Link>
    )
  </div>
}
