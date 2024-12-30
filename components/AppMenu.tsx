import Link from 'next/link'
import { MouseEvent, ReactElement } from 'react'
import { publicTagName } from '../utils/consts'
import { setAuthCookies } from '../utils/cookies'
import { logToGTM } from '../utils/tag-manager'
import { copyPageLink } from '../utils/url'
import { TitleLink } from './TitleLink'
import type { CopyToClipboardProps } from './CopyToClipboard'

interface AppMenuProps extends CopyToClipboardProps {
  dropdown?: boolean
  authTitle: string
}

export function AppMenu({ dropdown, authTitle, page, search, tag, setToast }: AppMenuProps): ReactElement {
  const ulClassName = dropdown ? 'dropdown-menu dropdown-menu-start' : 'navbar-nav'
  const liClassName = dropdown ? '' : 'nav-item'
  const linkClassName = dropdown ? 'dropdown-item' : 'nav-link active text-nowrap'
  const inlineLinkClassName = linkClassName + ' d-inline'

  async function copyUrl(e: MouseEvent) {
    e.preventDefault()
    await copyPageLink(page, search, tag, setToast)
  }

  const enterExitLink = (className: string) => <Link href="/">
    <a className={className} onClick={() => {
      setAuthCookies('', '')
      logToGTM({ event: 'logout', authTitle })
    }}>{authTitle ? 'יציאה' : 'כניסה'}</a>
  </Link>

  return <ul className={ulClassName}>
    <li className={liClassName}><TitleLink className={linkClassName} href={`/tag/${publicTagName}`} title="דפים ציבוריים"/></li>
    <li className={liClassName}><TitleLink className={linkClassName} href="/" onClick={copyUrl} title="העתק כתובת"/></li>
    <li className={liClassName}><TitleLink className={linkClassName} href="/new_page" title="הוספת דף חדש"/></li>
    <li className={liClassName}><TitleLink className={linkClassName} href="/help" title="הסבר על האתר"/></li>
    <li className={liClassName}><TitleLink className={linkClassName} href="https://github.com/splintor/yeruham-phone-book-web-site" title="קוד מקור"/></li>
    <li className={liClassName}>{dropdown
      ? enterExitLink(linkClassName)
      : <span className="nav-link">{authTitle ? <TitleLink className={inlineLinkClassName} title={authTitle}/> : <b className={inlineLinkClassName}>אורח/ת</b>} ({enterExitLink(inlineLinkClassName)})</span>}
    </li>
  </ul>
}

