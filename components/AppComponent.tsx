import { useRouter } from 'next/router'
import React, { BaseSyntheticEvent, ReactElement, ReactNode, useEffect, useRef, useState } from 'react'
import useDebounce from '../hooks/useDebounce'
import { AppProps, SearchResults } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { adminEmail, siteTitle } from '../utils/consts'
import { AuthData, isAuthTitleNew } from '../utils/cookies'
import { searchForPages } from '../utils/requests.client'
import { initTagManager, logToGTM } from '../utils/tag-manager'
import { getSearchUrl, pageUrl } from '../utils/url'
import { deletedPageTitleKey, getPageTitle, ToastOptions } from './App'
import { NavBar } from './NavBar'
import { PageContent } from './PageContent'
import { PageHtmlRenderer } from './PageHtmlRenderer'
import { SearchBox } from './SearchBox'
import { TagLink } from './TagLink'
import { TitleLink } from './TitleLink'

function getSearchResultTitle(pages: PageData[], tags: string[], totalCount: number, search: string, tag: string, isGuestLogin: boolean): ReactNode {
  const pagesCount = pages && pages.length || 0
  const tagsCount = tags && tags.length || 0

  switch (pagesCount) {
    case 0:
      switch (tagsCount) {
        case 0:
          return <div>
            <p>לא נמצאו דפים תואמים לחיפוש שלך אחר <b>{search || tag}</b>.</p>
            <p>&nbsp;</p>
            {isGuestLogin
              ? <p>יכול להיות שזה מפני ש  <a href={`/`}>אינך מחובר/ת</a>.</p>
              : <p>אפשר לחפש משהו אחר או <a href={`/new_page?initialTitle=${search}`}>להוסיף דף חדש</a>.</p>}
          </div>
        case 1:
          return 'נמצאה קטגוריה אחת:'
        default:
          return `נמצאו ${tagsCount} קטגוריות:`
      }

    case 1:
      switch (tagsCount) {
        case 0:
          return 'נמצא דף אחד:'
        case 1:
          return 'נמצאו קטגוריה אחת ודף אחד:'
        default:
          return `נמצאו ${tagsCount} קטגוריות ודף אחד:`
      }

    default:
      const suffix = totalCount > pagesCount ?
        `${totalCount} דפים. מציג את ${pagesCount} הדפים הראשונים:` :
        `${pagesCount} דפים:`
      switch (tagsCount) {
        case 0:
          return `נמצאו ${suffix}`
        case 1:
          return `נמצאו קטגוריה אחת ו-${suffix}`
        default:
          return `נמצאו ${tagsCount} קטגוריות ו-${suffix}`
      }
  }
}

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
  const [displayedPage, setDisplayedPage] = useState(appProps.newPage ? { title: appProps.initialTitle || '', html: '' } : appProps.page)
  const [search, setSearch] = useState(searchFromResults || '')
  const [tag, setTag] = useState(appProps.tag)
  const [isSearching, setIsSearching] = useState(false)
  const [isNewPage, setIsNewPage] = useState(appProps.newPage)
  const [toast, setToast] = useState<ToastOptions>()
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
          if (!c.innerText?.trim()) {
            c.remove()
          }
        }

        if (p.scrollHeight > p.offsetHeight) {
          p.classList.add('truncated')
        }
      })
    }
  }, [pages])

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

  // noinspection HtmlUnknownTarget
  return (<>
    <NavBar authTitle={authTitle} showWelcome={showWelcome}
            search={search} goToHome={goToHome} performSearch={performSearch}
            markUserEdit={markUserEdit} searchFocusId={searchFocusId}/>
    <main className={showWelcome ? 'container showWelcome' : 'container'}>
    {toast && <div className={`alert alert-danger ${toast.position} ${toast.type}`}>
      {toast.content}
      <button className="close-button" onClick={() => setToast(undefined)}>X</button>
    </div>}

    {showWelcome
      ? <div className="container d-flex mt-3">
        <div className="row align-self-center card border-primary mx-auto px-1 py-3">
          <div className="mb-2">
            {authTitle
              ? <label htmlFor="search-box">חיפוש אדם, עסק או מוסד (אפשר גם <a href="/new_page">להוסיף דף חדש</a>)</label>
              : <label htmlFor="search-box">חיפוש עסק או מוסד ציבורי</label>}
          </div>
          <SearchBox search={search} performSearch={performSearch} markUserEdit={markUserEdit} searchFocusId={searchFocusId}/>
          <div className="mt-2">
            האתר זמין גם כ<a href="https://play.google.com/store/apps/details?id=com.splintor.yeruhamphonebook">אפליקצית
            אנדרואיד</a> וכ<a href="https://groups.google.com/d/msg/yerucham1/QWQYnxeXNfU/Q104gimvAAAJ">בוט בטלגרם</a>
          </div>
          <div className="mt-2">
            הסבר על השימוש באתר אפשר למצוא כאן
          </div>
          <div className="mt-2">
            הערות והצעות <a href={`mailto:${adminEmail}?subject=ספר הטלפונים של ירוחם`}>כדאי לשלוח במייל</a>
          </div>
          <a href="/" className="mt-3 d-flex justify-content-center">
            <img src="/logo.png" alt={siteTitle} width={'75%'}/>
          </a>
        </div>
      </div>
      : displayedPage
        ? <PageContent status={status} page={displayedPage} pages={pages} search={search} tag={tag} totalCount={totalCount}
                       newPage={isNewPage} pushState={pushState} setToast={setToast} onUpdatePageTitle={onUpdatePageTitle} isGuestLogin={!authTitle}/>
        : <div className="results">
          {isSearching
            ? <span className="loading">מחפש...</span>
            : <>
              {tag && <h1><TagLink tag={tag} pushState={pushState}/></h1>}
              <div className="resultsTitle">{getSearchResultTitle(pages, tags, totalCount, search, tag, !authTitle)}</div>
              {
                tags && tags.map(t => <TagLink key={t} tag={t} pushState={pushState} className="titleLink tag"/>)
              }
              {
                pages && pages.map((page, i) => <div className="result" key={i}>
                  <TitleLink title={page.title} key={page.title} onClick={e => {
                    e.preventDefault()
                    pushState(pageUrl(page.title), { page, pages, totalCount, tags, tag, search })
                  }}/>
                  <input type="checkbox" id={page.title}/>
                  <PageHtmlRenderer pushState={pushState} className="preview" page={page} pages={pages} totalCount={totalCount} search={search} tags={tags} tag={tag}/>
                  <label htmlFor={page.title} role="button">הצג עוד</label>
                </div>)
              }
            </>
          }
        </div>
    }
  </main>
  </>)
}
