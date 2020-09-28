import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import useDebounce from '../hooks/useDebounce'
import { AppProps, SearchResults } from '../types/AppProps'
import { PageData } from '../types/PageData';
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

function PageContent({ status, search, tag, page: { html, title } }: Pick<AppProps, 'status' | 'page' | 'search' | 'tag'>) {
  switch(status) {
    case 404:
      return <div className="results page">
        <div className="notFound">הדף <span className="searchedTitle">{title}</span> לא נמצא בספר הטלפונים.</div>
      </div>

    default:
      const backUrl = search ? `/search/${search}` : tag ? `/tag/${tag}` : null
      return <div className="results page">
        <h1>
          {backUrl && <a className="backButton" href={backUrl} onClick={e => { e.preventDefault(); history.back() }}>&#8658;</a>}
          <a href={pageUrl(title)}>{title}</a>
        </h1>
        <div dangerouslySetInnerHTML={{ __html: html }}/>
      </div>
  }
}

function AppComponent(appProps: AppProps) {
  const [{ pages, tags, totalCount}, setSearchResults] = useState<SearchResults>({ pages: appProps.pages, totalCount: appProps.totalCount, tags: appProps.tags })
  const [displayedPage, setDisplayedPage] = useState(appProps.page)
  const [search, setSearch] = useState(appProps.search || '')
  const [tag, setTag] = useState(appProps.tag)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(search, 300)
  const stringBeingSearched = useRef(search)
  const lastSearch = useRef(search)
  const searchInput = useRef(null)
  const router = useRouter()
  const showWelcome = !search && !displayedPage && !pages

  function focusSearchInput(element = null) {
    if (element) {
      searchInput.current = element;
    }

    if (searchInput.current) {
      searchInput.current.focus();
      if (search === appProps.search) {
        searchInput.current.selectionStart = search.length
      }
    }
  }

  useEffect(() => { lastSearch.current = search }, [search])

  useEffect(() => {
    if (pages) {
      const { state } = window.history.state || {}
      if (!state) {
        window.history.replaceState(appProps, '', location.href)
      }
    }
  }, [])

  const processDynamicState = useCallback((state: Partial<AppProps>) => {
    const { search, page, pages, tags, tag, totalCount } = state
    setSearch(search || '')
    setDisplayedPage(page || null)
    setIsSearching(false)
    setSearchResults({ pages, tags, totalCount })
    setTag(tag)
    focusSearchInput()
  }, [setDisplayedPage, setSearchResults, setIsSearching, setSearchResults, setTag])

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
    if (!search) {
      return
    }
    
    setIsSearching(true)
    updateSearchInPage(search, await searchForPages(search))
  }, [search, setSearchResults])

  useEffect(() => {
    if (!debouncedSearchTerm) {
      setIsSearching(false)
      return
    }

    if (stringBeingSearched.current !== debouncedSearchTerm) {
      setIsSearching(true)
      stringBeingSearched.current = debouncedSearchTerm
      searchForPages(debouncedSearchTerm).then(results => {
        if (stringBeingSearched.current === debouncedSearchTerm && lastSearch.current === debouncedSearchTerm) {
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
        <input type="text" value={search} ref={focusSearchInput} onChange={e => setSearch(e.target.value)} placeholder="חפש אדם, עסק או מוסד"/>
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
        : displayedPage
          ? <PageContent status={appProps.status} page={displayedPage} search={pages && search} tag={pages && tag}/>
          : <div className="results">
            {isSearching
              ? <span className="loading">מחפש...</span>
              : <>
                  {tag && <h1><a href={`/tag/${tag}`}>{tag}</a></h1>}
                  <div className="resultsTitle">{getSearchResultTitle(pages, tags, totalCount)}</div>
                  {
                    tags && tags.map(t => <a className="titleLink tag" key={t} href={`/tag/${t}`}>{t}</a>)
                  }
                  {
                    pages && pages.map(page => <TitleLink title={page.title} key={page.title} onClick={e => {
                        e.preventDefault()
                        pushState(pageUrl(page.title), { page, pages, totalCount, tags, tag, search })
                      }}/>)
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

function getSearchResultTitle(pages: PageData[], tags: string[], totalCount) {
  const pagesCount = pages && pages.length || 0
  const tagsCount = tags && tags.length || 0

  switch (pagesCount) {
    case 0:
      switch (tagsCount) {
        case 0: return 'לא נמצאו תוצאות.'
        case 1: return 'נמצאה קטגוריה אחת:'
        default: return `נמצאו ${tagsCount} קטגוריות:`
      }

    case 1:
      switch (tagsCount) {
        case 0: return 'נמצא דף אחד:'
        case 1: return 'נמצאו קטגוריה אחת ודף אחד:'
        default: return `נמצאו ${tagsCount} קטגוריות ודף אחד:`
      }

    default:
      const suffix = totalCount > pagesCount ?
        `${totalCount} דפים. מציג את ${pagesCount} הראשונים:` :
        `${pagesCount} דפים:`
      switch (tagsCount) {
        case 0: return `נמצאו ${suffix}`
        case 1: return `נמצאו קטגוריה אחת ו-${suffix}`
        default: return `נמצאו ${tagsCount} קטגוריות ן-${suffix}`
      }
  }
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
