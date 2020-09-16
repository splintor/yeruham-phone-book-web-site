import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import useDebounce from '../hooks/useDebounce'
import { AppProps } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { adminEmail, siteTitle } from '../utils/consts'
import { parseAuthCookies } from '../utils/cookies'
import { AccountBadge } from './AccountBadge'
import { LoginPage } from './LoginPage'
import { TitleLink } from './TitleLink'

async function searchForPages(search: string) {
  const { auth } = parseAuthCookies()
  if (auth && search) {
    const res = await fetch(`/api/pages/search/${search}`, { headers: { Cookie: `auth=${auth}` } })
    if (res.ok) {
      return (await res.json()).pages as PageData[]
    }
  }

  return null
}

function PageContent({ status, page: { html, title } }: Pick<AppProps, 'status' | 'page'>) {
  switch(status) {
    case 404:
      return <h3 className="notFound">הדף <span className="title">{title}</span> לא נמצא בספר הטלפונים</h3>

    default:
      return <div className="results page">
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: html }}/>
      </div>
  }
}

function AppComponent(appProps: AppProps) {
  const { pages, page, search, tag, status } = appProps
  const [results, setResults] = useState(null)
  const [userSearch, setUserSearch] = useState(search || '')
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(userSearch, 500)
  const stringBeingSearched = useRef(search)
  const router = useRouter()
  const pagesToShow = results || pages
  const focusInput = useCallback(element => element?.focus(), [])
  const showWelcome = !search && !userSearch && !page && !pages

  useEffect(() => {
    const activeSearch = router.query.search as string
    const activeTag = router.query.tag as string
    if (activeSearch !== search || activeTag !== tag) {
      document.title = getPageTitle({ ...appProps, search: activeSearch, tag: activeTag })
    }
  }, [router, search, tag])

  const updateSearchInPage = (search: string, results: PageData[]) => {
    setResults(results)
    setIsSearching(false)
    router.push(search ? `/search/[search]` : '/', search ? `/search/${search}` : '/', { shallow: true }).catch(e => console.error(e))
    document.title = getPageTitle({ ...appProps, search })
  }

  const performSearch = useCallback(async () => {
    if (!userSearch) {
      return
    }
    
    setIsSearching(true)
    stringBeingSearched.current = debouncedSearchTerm
    updateSearchInPage(userSearch, await searchForPages(userSearch))
  }, [userSearch, setResults])

  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsSearching(true)
      stringBeingSearched.current = debouncedSearchTerm
      searchForPages(debouncedSearchTerm).then(results => {
        if (stringBeingSearched.current === debouncedSearchTerm) {
          updateSearchInPage(debouncedSearchTerm, results)
        }
      })
    }
  }, [debouncedSearchTerm])

  return (
    <main className={ showWelcome ? 'showWelcome' : '' }>
      <AccountBadge/>
      <Link href="/">
        <a href="/" className="titleLink">
          <h1 className="title">{siteTitle}</h1>
        </a>
      </Link>
      <form className="searchForm" onSubmit={async e => {
        e.preventDefault()
        await performSearch()
      }}>
        <input type="text" value={userSearch} ref={focusInput} onChange={e => setUserSearch(e.target.value)} placeholder="חפש אדם, עסק או מוסד"/>
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
        : page
          ? <PageContent status={status} page={page}/>
          : <div className="results">
            {isSearching
              ? <span className="loading">מחפש...</span>
              : pagesToShow?.length === 0
                ? <span className="noResults">לא נמצאו תוצאות.</span>
                : pagesToShow?.map(({ title }) => <TitleLink title={title} key={title}/>)}
          </div>
      }
      <div className="logo"><img src="/logo.png" alt={siteTitle} /></div>
    </main>
  )
}

function getPageTitle({ search, tag, page }: AppProps) {
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
