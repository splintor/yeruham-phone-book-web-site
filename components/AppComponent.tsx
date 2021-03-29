import { useRouter } from 'next/router'
import React, { BaseSyntheticEvent, ReactElement, useEffect, useRef, useState } from 'react'
import useDebounce from '../hooks/useDebounce'
import { useKeyPress } from '../hooks/useKeyPress'
import { AppProps, SearchResults } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { AuthData, isAuthTitleNew } from '../utils/cookies'
import { getSearchResultTitle } from '../utils/getSearchResultTitle'
import { searchForPages } from '../utils/requests.client'
import { initTagManager, logToGTM } from '../utils/tag-manager'
import { getSearchUrl, getTagUrl, pageUrl } from '../utils/url'
import { deletedPageTitleKey, getPageTitle, ToastOptions } from './App'
import { NavBar } from './NavBar'
import { PageContent } from './PageContent'
import { PageHtmlRenderer } from './PageHtmlRenderer'
import { TagLink } from './TagLink'
import { TitleLink } from './TitleLink'
import { WelcomePage } from './WelcomePage'

export function AppComponent(appProps: AppProps & { authData: AuthData }): ReactElement {
  const [fromUserEdit, setFromUserEdit] = useState(false)
  const [searchFocusId, setSearchFocusId] = useState(0)
  const { status } = appProps
  const [{ pages, tags, totalCount, search: searchFromResults }, setSearchResults] = useState<SearchResults>({
    pages: appProps.pages,
    totalCount: appProps.totalCount,
    tags: appProps.tags,
    search: appProps.search,
  })
  const [focusedPage, setFocusedPage] = useState<PageData>(null)
  const pagesToShow = focusedPage ? [focusedPage] : pages
  const [displayedPage, setDisplayedPage] = useState(appProps.newPage ? { title: appProps.initialTitle || '', html: '' } : appProps.page)
  const [search, setSearch] = useState(searchFromResults || '')
  const [tag, setTag] = useState(appProps.tag)
  const [isSearching, setIsSearching] = useState(false)
  const [isNewPage, setIsNewPage] = useState(appProps.newPage)
  const [toast, setToast] = useState<ToastOptions>()
  const escapePressed = useKeyPress('Escape')
  const debouncedSearchTerm = useDebounce(search, 300)
  const stringBeingSearched = useRef(search)
  const lastSearch = useRef(search)
  const router = useRouter()
  const showWelcome = !isSearching && !displayedPage && !pages
  const { authTitle } = appProps.authData

  useEffect(() => {
    window.history.replaceState(appProps, '', location.href)
    initTagManager(appProps.url, authTitle)
    if (isAuthTitleNew()) {
      setToast({ position: 'top', timeout: 4000, content: <div>איזה כיף שהתחברת לספר הטלפונים של ירוחם, <b>{authTitle}</b>!</div> })
    }
  }, [])

  useEffect(() => {
    lastSearch.current = search
    if (!search) {
      stringBeingSearched.current = search
    }
  }, [search])

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(undefined), toast.timeout || 10000)
      return () => clearTimeout(id)
    }
  }, [toast])

  useEffect(() => {
    if (pages?.length > 0) {
      document.querySelectorAll?.('.preview, .preview > table > tbody > tr > td > div').forEach((p: HTMLElement) => {
        for (let i = p.children.length - 1; i >= 0; --i) {
          const c = p.children[i] as HTMLElement
          if (!c.innerText?.trim() && !c.querySelector('img')) {
            c.remove()
          }
        }

        setTimeout(() => {
          if (!focusedPage && p.scrollHeight > p.offsetHeight) {
            p.classList.add('truncated')
          } else {
            p.classList.remove('truncated')
          }
        }, 0)
      })
    }
  }, [pagesToShow])

  useEffect(() => {
    const deletedPageTitle = sessionStorage.getItem(deletedPageTitleKey)
    if (deletedPageTitle) {
      sessionStorage.removeItem(deletedPageTitleKey)
      setSearchResults({ pages: pages.filter(p => p.title !== deletedPageTitle), tags, totalCount, search })
    }
  }, [setSearchResults, pages, tags, totalCount])

  const processDynamicState = (state: Partial<AppProps>) => {
    const { search, page, pages, tags, tag, totalCount } = state
    setSearch(search || '')
    setDisplayedPage(page || null)
    setIsSearching(false)
    setSearchResults({ pages, tags, totalCount, search })
    setTag(tag)
    setIsNewPage(state.newPage || false)
    logToGTM({ event: 'navigation', authTitle, ...state })
    setSearchFocusId(Date.now())
  }

  function pushState(url: string, state: Partial<AppProps>) {
    window.history.pushState(state, '', url)
    document.title = getPageTitle(state)
    processDynamicState(state)
  }

  function goToHome() {
    pushState('/', {})
    setSearchFocusId(Date.now())
  }

  function onUpdatePageTitle(page) {
    const props: AppProps = { ...appProps, page }
    window.history.replaceState(props, '', pageUrl(page.title))
    document.title = getPageTitle(props)
    processDynamicState(props)
  }

  useEffect(() => {
    window.addEventListener('popstate', (e: PopStateEvent) => {
      processDynamicState(e.state as AppProps)
      return false
    })
  }, [])

  useEffect(() => {
    const activeSearch = router.query.search as string
    const activeTag = router.query.tag as string
    if (activeSearch !== search || activeTag !== tag) {
      document.title = getPageTitle({ ...appProps, search: activeSearch, tag: activeTag })
    }
  }, [router, search, tag])

  const updateSearchInPage = ({ search, ...results }: SearchResults) => {
    setFromUserEdit(false)
    stringBeingSearched.current = search
    pushState(getSearchUrl(search), { search, ...results })
  }

  const performSearch = async (e: BaseSyntheticEvent) => {
    e.preventDefault()
    if (!search) {
      return
    }

    setFocusedPage(null)
    setIsSearching(true)
    setFromUserEdit(false)
    updateSearchInPage(await searchForPages(search))
  }

  useEffect(() => {
    if (showWelcome) {
      return
    }

    if (!debouncedSearchTerm) {
      setIsSearching(!pages)
      return
    }

    if (fromUserEdit && stringBeingSearched.current !== debouncedSearchTerm) {
      setIsSearching(true)
      stringBeingSearched.current = debouncedSearchTerm
      searchForPages(debouncedSearchTerm).then(results => {
        if (stringBeingSearched.current === debouncedSearchTerm && lastSearch.current === debouncedSearchTerm) {
          updateSearchInPage(results)
        }
      })
    }
  }, [debouncedSearchTerm, showWelcome])

  useEffect(() => {
    Array.from(document.links).forEach(link => {
      if (link.href[0] !== '/' && !link.href.startsWith?.(location.origin) && !link.target) {
        link.target = '_blank'
      }
    })
  }, [displayedPage, pages, isSearching])

  const markUserEdit = (userSearch: string) => {
    setFromUserEdit(true)
    setSearch(userSearch)
  }

  const cancelFocusPage = focusedPage ? () => {
    setFocusedPage(null)
    pushState(tag ? getTagUrl(tag) : getSearchUrl(search), { pages, totalCount, tags, tag, search })
  } : () => void 0

  if (escapePressed) {
    cancelFocusPage()
  }

  // noinspection HtmlUnknownTarget
  return (<>
    <NavBar authTitle={authTitle} showWelcome={showWelcome}
            search={search} goToHome={goToHome} performSearch={performSearch}
            markUserEdit={markUserEdit} searchFocusId={searchFocusId}/>
    <main className={'container mw-100' + showWelcome ? ' showWelcome' : ''}>
    {toast && <div className={`alert alert-danger ${toast.position} ${toast.type}`}>
      {toast.content}
      <button className="close-button" onClick={() => setToast(undefined)}>X</button>
    </div>}

    {showWelcome
      ? <WelcomePage authTitle={authTitle} search={search} performSearch={performSearch} markUserEdit={markUserEdit} searchFocusId={searchFocusId}/>
      : displayedPage
        ? <PageContent status={status} page={displayedPage} pages={pages} search={search} tag={tag} totalCount={totalCount}
                       newPage={isNewPage} pushState={pushState} setToast={setToast} onUpdatePageTitle={onUpdatePageTitle} isGuestLogin={!authTitle}/>
        : <div className="results p-2">
          {isSearching
            ? <div className="d-flex justify-content-center text-primary mt-4"><div>
                  <span className="spinner-border spinner-border-sm me-1" role="status"/>
                    מחפש...
              </div></div>
            : <>
              {focusedPage ? <></> : <>
              {tag && <h3><TagLink tag={tag} pushState={pushState}/></h3>}
              <h5>{getSearchResultTitle(pages, tags, totalCount, search, tag, !authTitle)}</h5>
              {
                tags && tags.map(t => <span className="fs-4">
                  <TagLink key={t} tag={t} pushState={pushState} className="badge bg-primary link-light rounded-pill mb-2 me-1"/>
                </span>)
              }
              </>}
              {
                pagesToShow && pagesToShow.map((page) => <div className="result card p-1 mb-3" key={page.title}>
                  <div className="card-body p-2">
                    {focusedPage && <div className="float-end">
                      <button type="button" className="btn-close" aria-label="Close" onClick={cancelFocusPage}/>
                    </div>}
                    <h5 className="card-title">
                      <TitleLink title={page.title} key={page.title} onClick={e => {
                        if (!focusedPage) {
                          e.preventDefault()
                          pushState(pageUrl(page.title), { pages, totalCount, tags, tag, search })
                          setFocusedPage(page)
                        }
                      }}/>
                    </h5>
                    <input type="checkbox" id={page.title}/>
                    <PageHtmlRenderer pushState={pushState} className={'preview' + (focusedPage ? ' focused' : '')} page={page} pages={pages} totalCount={totalCount} search={search} tags={tags} tag={tag}/>
                    <label htmlFor={page.title} role="button">הצג עוד</label>
                  </div>
                </div>)
              }
            </>
          }
        </div>
    }
  </main>
  </>)
}
