import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import useDebounce from '../hooks/useDebounce'
import { AppProps, SearchResults } from '../types/AppProps'
import { adminEmail, siteTitle } from '../utils/consts'
import { parseAuthCookies } from '../utils/cookies'
import { pageUrl } from '../utils/url';
import { AccountBadge } from './AccountBadge'
import { LoginPage } from './LoginPage'
import { TitleLink } from './TitleLink'

async function searchForPages(search: string) {
  const { auth } = parseAuthCookies()
  if (auth && search) {
    const res = await fetch(`/api/pages/search/${search}`, { headers: { Cookie: `auth=${auth}` } })
    if (res.ok) {
      return res.json()
    }
  }

  return null
}

function PageContent({ status, search, page: { html, title } }: Pick<AppProps, 'status' | 'page' | 'search'>) {
  switch(status) {
    case 404:
      return <div className="results page">
        <div className="notFound">הדף <span className="searchedTitle">{title}</span> לא נמצא בספר הטלפונים.</div>
      </div>

    default:
      return <div className="results page">
        <h1>
          {search && <a className="backButton" href={`/search/${search}`} onClick={e => { e.preventDefault(); history.back() }}>&#8658;</a>}
          <a href={`/${pageUrl(title)}`}>{title}</a>
        </h1>
        <div dangerouslySetInnerHTML={{ __html: html }}/>
      </div>
  }
}

function AppComponent(appProps: AppProps) {
  const { pages, page, search, tag, status, totalCount } = appProps
  const [searchResults, setSearchResults] = useState<SearchResults>(null)
  const [displayedPage, setDisplayedPage] = useState(undefined)
  const [userSearch, setUserSearch] = useState(search || '')
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(userSearch, 300)
  const stringBeingSearched = useRef(userSearch)
  const lastUserSearch = useRef(userSearch)
  const searchInput = useRef(null)
  const router = useRouter()
  const pagesToShow = searchResults ? searchResults.pages : pages
  const totalCountToShow = searchResults?.totalCount ?? totalCount
  const pageToShow = displayedPage === undefined ? page : displayedPage
  const showWelcome = !userSearch && !pageToShow && !pagesToShow

  console.log('debouncedSearchTerm', debouncedSearchTerm);

  function focusSearchInput(element = null) {
    if (element) {
      searchInput.current = element;
    }

    if (searchInput.current) {
      searchInput.current.focus();
      if (search === userSearch) {
        searchInput.current.selectionStart = search.length
      }
    }
  }

  useEffect(() => {
    lastUserSearch.current = userSearch
  }, [userSearch])

  const processDynamicState = useCallback((state: Partial<AppProps>) => {
    const { search, page, pages, totalCount } = state
    setUserSearch(search || '')
    setDisplayedPage(page || null)
    setIsSearching(false)
    setSearchResults({ pages, totalCount })
    focusSearchInput()
  }, [setDisplayedPage, setUserSearch, setIsSearching, setSearchResults])

  function pushState(url, state: Partial<AppProps>) {
    window.history.pushState(state, '', url);
    document.title = getPageTitle(state)
    processDynamicState(state)
  }

  useEffect(() => {
    router.beforePopState(state => {
      processDynamicState(state);
      return false;
    })
  }, [router, processDynamicState])

  useEffect(() => {
    const activeSearch = router.query.search as string
    const activeTag = router.query.tag as string
    if (activeSearch !== search || activeTag !== tag) {
      document.title = getPageTitle({ ...appProps, search: activeSearch, tag: activeTag })
    }
  }, [router, search, tag])

  const updateSearchInPage = (search: string, results: SearchResults) => {
    pushState(search ? `/search/${search}` : '/', { search, ...results })
  }

  const performSearch = useCallback(async () => {
    if (!userSearch) {
      return
    }
    
    setIsSearching(true)
    updateSearchInPage(userSearch, await searchForPages(userSearch))
  }, [userSearch, setSearchResults])

  useEffect(() => {
    if (!debouncedSearchTerm) {
      setIsSearching(false)
      return
    }

    if (stringBeingSearched.current !== debouncedSearchTerm) {
      setIsSearching(true)
      stringBeingSearched.current = debouncedSearchTerm
      searchForPages(debouncedSearchTerm).then(results => {
        if (stringBeingSearched.current === debouncedSearchTerm && lastUserSearch.current === debouncedSearchTerm) {
          updateSearchInPage(debouncedSearchTerm, results)
        }
      })
    }
  }, [debouncedSearchTerm])

  return (
    <main className={ showWelcome ? 'showWelcome' : '' }>
      <AccountBadge/>
      <Link href="/">
        <h1 className="title">
          <TitleLink title={siteTitle} onClick={e => {
            e.preventDefault()
            pushState('/', {})
            focusSearchInput()
          }}/>
        </h1>
      </Link>
      <form className="searchForm" onSubmit={async e => {
        e.preventDefault()
        await performSearch()
      }}>
        <input type="text" value={userSearch} ref={focusSearchInput} onChange={e => setUserSearch(e.target.value)} placeholder="חפש אדם, עסק או מוסד"/>
        <span className="searchIcon" style={{ display: 'none' }}>
            <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </span>
      </form>

      {showWelcome
        ? <>
          <div>
            האתר זמין גם כ<a href="https://play.google.com/store/apps/details?id=com.splintor.yeruhamphonebook">אפליקצית
            אנדרואיד</a> וכ<a href="https://groups.google.com/d/msg/yerucham1/QWQYnxeXNfU/Q104gimvAAAJ">בוט בטלגרם</a>
          </div>
          <div>
            הסבר על השימוש באתר אפשר למצוא כאן
          </div>

          <div>
            הערות והצעות <a href={`mailto:${adminEmail}?subject=ספר הטלפונים של ירוחם`}>כדאי לשלוח במייל</a>
          </div>
        </>
        : pageToShow
          ? <PageContent status={status} page={pageToShow} search={searchResults && userSearch}/>
          : <div className="results">
            {isSearching
              ? <span className="loading">מחפש...</span>
              : !pagesToShow || pagesToShow.length === 0
                ? <span className="noResults">לא נמצאו תוצאות.</span>
                : <>
                  <div className="resultsTitle">{
                    pagesToShow.length === 1 ? 'נמצא דף אחד:' :
                      totalCountToShow > pagesToShow.length ? `נמצאו ${totalCountToShow} דפים. מציג את ${pagesToShow.length} הראשונים:` :
                        `נמצאו ${pagesToShow.length} דפים:`
                  }</div>
                  {
                    pagesToShow.map(page => <div className="preview" key={page.title}>
                      <TitleLink title={page.title} onClick={e => {
                        e.preventDefault()
                        pushState(pageUrl(page.title), { page, search: userSearch })
                      }}/>
                    </div>)
                  }
                </>
            }
          </div>
      }
      <div className="logo"><img src="/logo.png" alt={siteTitle} /></div>
    </main>
  )
}

function getPageTitle({ search, tag, page }: Partial<AppProps>) {
  return search
    ? `${siteTitle} - חיפוש - ${search}`
    : tag
      ? `${siteTitle} - ${tag}`
      : page
        ? `${siteTitle} - ${page.title}`
        : siteTitle
}

export default function App(appProps: AppProps) {
  const { url, origin, status } = appProps
  const pageTitle = getPageTitle(appProps)
  return <div className="app">
    <Head>
      <title>{pageTitle}</title>
      <meta property="og:title" content={pageTitle} key="pageTitle"/>
      <meta property="og:url" content={url} key="url"/>
      <meta property="og:image" content={`${origin}/logo.png`} key="image"/>
      <link rel="icon" href="/favicon.ico"/>
    </Head>
    {status === 401 ? <LoginPage/> : <AppComponent {...appProps} />}
  </div>
}
