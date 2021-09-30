import React, { BaseSyntheticEvent, ReactElement } from 'react'
import { PageData } from '../types/PageData'
import { siteTitle } from '../utils/consts'
import { ToastOptions } from './App'
import { AppMenu } from './AppMenu'
import { Logo } from './Logo'
import { SearchBox } from './SearchBox'
import { TitleLink } from './TitleLink'

interface NavBarProps {
  authTitle: string
  page: PageData
  search: string
  tag: string
  setToast(toastOptions: ToastOptions): void
  showWelcome: boolean
  goToHome()
  performSearch(e: BaseSyntheticEvent)
  markUserEdit(userSearch: string): void
  searchFocusId: number
}

export const NavBar = ({ authTitle, showWelcome, goToHome, page, search, tag, setToast, performSearch, markUserEdit, searchFocusId }: NavBarProps): ReactElement => (
  <nav className="navbar navbar-expand-sm navbar-dark bg-primary">
    <div className="container-fluid pe-0">
      <div className="text-nowrap">
        <a className="navbar-brand app-icon" href="/">
          <Logo width="40" height="40"/>
        </a>
        <TitleLink title={siteTitle} href="/" className="navbar-brand" onClick={e => {
          e.preventDefault()
          goToHome()
        }}/>
      </div>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navBarDropdown">
        <span className="navbar-toggler-icon"/>
      </button>
      {showWelcome || <SearchBox className="py-2 py-md-0" search={search} performSearch={performSearch} markUserEdit={markUserEdit} searchFocusId={searchFocusId}/>}
      <div className="collapse nav-collapse d-sm-none" id="navBarDropdown">
        <AppMenu authTitle={authTitle} page={page} search={search} tag={tag} setToast={setToast}/>
      </div>
      <ul className="navbar-nav ms-auto d-none d-sm-flex">
        <li className="nav-item">
          <TitleLink className="nav-link text-nowrap active"
                     title={authTitle || 'אורח/ת'}
                     href={authTitle ? undefined : '/'}/>
        </li>
        <li>
          <div className="dropdown">
            <button className="btn btn-primary px-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <span className="navbar-toggler-icon"/>
            </button>
            <AppMenu authTitle={authTitle} dropdown page={page} search={search} tag={tag} setToast={setToast}/>
          </div>
        </li>
      </ul>
    </div>
  </nav>
)
