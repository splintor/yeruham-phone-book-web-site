import Link from 'next/link'
import { setAuthCookies } from '../utils/cookies'
import { logToGTM } from '../utils/tag-manager'
import { TitleLink } from './TitleLink'

export function AppMenu({ dropdown, authTitle }: { dropdown?: boolean, authTitle: string }) {
  const ulClassName = dropdown ? 'dropdown-menu dropdown-menu-start' : 'navbar-nav'
  const liClassName = dropdown ? '' : 'nav-item'
  const linkClassName = dropdown ? 'dropdown-item' : 'nav-link active text-nowrap'
  return <ul className={ulClassName}>
    <li className={liClassName}><TitleLink className={linkClassName} href="/new_page" title="הוספת דף חדש"/></li>
    <li className={liClassName}><TitleLink className={linkClassName} href="/help" title="הסבר על האתר"/></li>
    <li className={liClassName}><TitleLink className={linkClassName} href="https://github.com/splintor/yeruham-phone-book-web-site" title="קוד מקור"/></li>
    {dropdown || <li className={liClassName}>
      {authTitle ? <TitleLink className={linkClassName} title={authTitle}/> : <b className="nav-link text-light">אורח/ת</b>}
    </li>}
    <li className={liClassName}><Link href="/">
      <a className={linkClassName} onClick={() => {
        setAuthCookies('', '')
        logToGTM({ event: 'logout', authTitle })
      }}>{authTitle ? 'יציאה' : 'כניסה'}</a>
    </Link></li>
  </ul>
}

