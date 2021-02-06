import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { BaseSyntheticEvent, ReactElement, ReactNode, useEffect, useRef, useState } from 'react'
import TagManager from 'react-gtm-module'
import useDebounce from '../hooks/useDebounce'
import { AppProps, SearchResults } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { adminEmail, publicTagName, siteTitle } from '../utils/consts'
import { isAuthTitleNew, parseAuthCookies } from '../utils/cookies'
import { pageUrl } from '../utils/url'
import { AccountBadge } from './AccountBadge'
import { GitHubCorner } from './GitHubCorner'
import { LoginPage } from './LoginPage'
import { PageContent } from './PageContent'
import { TitleLink } from './TitleLink'

export const deletedPageTitleKey = 'deleted-page-title'

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

interface GTMDataLayer extends Partial<AppProps> {
  event: string;
  authTitle: string;
}

export function logToGTM(dataLayer: GTMDataLayer): void {
  TagManager.dataLayer({ dataLayer })
}

export interface ToastOptions {
  content: ReactNode;
  position?: 'top' | 'bottom'
  type?: 'success' | 'fail'
  timeout?: number
}

function AppComponent(appProps: AppProps) {
  const [fromUserEdit, setFromUserEdit] = useState(false)
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
  const searchInput = useRef(null)
  const router = useRouter()
  const showWelcome = !isSearching && !displayedPage && !pages
  const [authTitle, setAuthTitle] = useState('')
  const [isGuestLogin, setIsGuestLogin] = useState(true)

  useEffect(() => {
    const { authTitle, isGuestLogin } = parseAuthCookies()
    setAuthTitle(authTitle)
    setIsGuestLogin(isGuestLogin)
    TagManager.initialize({ gtmId: 'GTM-TCN5G8S', dataLayer: { event: 'load', url: appProps.url, status, authTitle } })
    if (isAuthTitleNew()) {
      setToast({ position: 'top', timeout: 4000, content: <div>ברוך הבא לספר הטלפונים של ירוחם, <b>{authTitle}</b>!</div> })
    }
  }, [])


  function focusSearchInput(element = null) {
    if (element) {
      searchInput.current = element
    }

    if (searchInput.current) {
      searchInput.current.focus()
      if (search === appProps.search) {
        searchInput.current.selectionStart = searchInput.current.value.length
      }
    }
  }

  useEffect(() => {
    lastSearch.current = search
    if (!search) {
      stringBeingSearched.current = search
    }
  }, [search])

  useEffect(() => {
    if (pages) {
      const { state } = window.history.state || {}
      if (!state) {
        window.history.replaceState(appProps, '', location.href)
      }
    }
  }, [])

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
    focusSearchInput()
  }

  function pushState(url: string, state: Partial<AppProps>) {
    window.history.pushState(state, '', url)
    document.title = getPageTitle(state)
    processDynamicState(state)
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

  const getSearchUrl = (search: string) => search ? `/search/${search}` : '/'
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

  // noinspection HtmlUnknownTarget
  return (
    <main className={showWelcome ? 'showWelcome' : ''}>
      <AccountBadge showWelcome={showWelcome} authTitle={authTitle} isGuestLogin={isGuestLogin}/>
      {toast && <div className={`toast ${toast.position} ${toast.type}`}>
        {toast.content}
        <button className="close-button" onClick={() => setToast(undefined)}>X</button>
      </div>}
      <Link href="/">
        <h1 className="title">
          <TitleLink title={siteTitle} onClick={e => {
            e.preventDefault()
            pushState('/', {})
            focusSearchInput()
          }}/>
        </h1>
      </Link>
      {showWelcome && (isGuestLogin
        ? <label htmlFor="search-box">חפש עסק או מוסד ציבורי</label>
        : <label htmlFor="search-box">חפש אדם, עסק או מוסד או <a href="/new_page">הוסף דף חדש</a></label>)}
      <form className="searchForm" onSubmit={performSearch}>
        <input name="search-box" type="text" value={search} ref={focusSearchInput} onChange={e => {
          setFromUserEdit(true)
          setSearch(e.target.value)
        }}/>
        <a href={getSearchUrl(search)} className="searchIcon" style={{ display: 'none' }} onClick={performSearch}>
          <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path style={{ fill: search ? 'black' : 'darkgrey'}}
              d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </a>
      </form>

      {showWelcome
        ? <div className="welcome">
          <GitHubCorner/>
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
        </div>
        : displayedPage
          ? <PageContent status={appProps.status} page={displayedPage} pages={pages} search={search} tag={tag} totalCount={totalCount}
                         newPage={isNewPage} pushState={pushState} setToast={setToast} onUpdatePageTitle={onUpdatePageTitle} isGuestLogin={isGuestLogin}/>
          : <div className="results">
            {isSearching
              ? <span className="loading">מחפש...</span>
              : <>
                {tag && <h1><a href={`/tag/${tag}`}>{tag}</a></h1>}
                <div className="resultsTitle">{getSearchResultTitle(pages, tags, totalCount, search, tag, isGuestLogin)}</div>
                {
                  tags && tags.map(t => <a className="titleLink tag" key={t} href={`/tag/${t}`}>{t}</a>)
                }
                {
                  pages && pages.map((page, i) => <div className="result" key={i}>
                    <TitleLink title={page.title} key={page.title} onClick={e => {
                      e.preventDefault()
                      pushState(pageUrl(page.title), { page, pages, totalCount, tags, tag, search })
                    }}/>
                    <input type="checkbox" id={page.title}/>
                    <div dangerouslySetInnerHTML={{ __html: page.html }} className="preview"/>
                    <label htmlFor={page.title} role="button">הצג עוד</label>
                  </div>)
                }
              </>
            }
          </div>
      }
      <a href="/">
        <div className="logo"><img src="/logo.png" alt={siteTitle}/></div>
      </a>
    </main>
  )
}

function getPageTitle({ search, tag, page, newPage }: Partial<AppProps>) {
  return page
    ? `${page.title} - ${siteTitle}`
    : tag
      ? `${tag} - ${siteTitle}`
      : newPage
        ? `דף חדש - ${siteTitle}`
        : search
          ? `חיפוש: ${search} - ${siteTitle}`
          : siteTitle
}

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
            {isGuestLogin || <p>אפשר לחפש משהו אחר או <a href={`/new_page?initialTitle=${search}`}>להוסיף דף חדש</a>.</p>}
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

export default function App(appProps: AppProps): ReactElement {
  const router = useRouter()
  const { url, origin, status, page } = appProps
  const pageTitle = getPageTitle(appProps)
  const showPreview = !router.query.noPreview
  const isPublicPage = page?.tags?.includes(publicTagName)

  return <div className="app">
    {showPreview && <Head>
      <title>{pageTitle}</title>
      <meta property="og:title" content={pageTitle} key="pageTitle"/>
      {isPublicPage && <meta property="og:description" content={page.html.replace(/<[^>]+>|&nbsp;/g, ' ')} key="pageHtml"/>}
      <meta property="og:url" content={url} key="url"/>
      <meta property="og:image" content={`${origin}/logo.png`} key="image"/>
      <link rel="icon" href="/favicon.ico"/>
      <link rel="search" type="application/opensearchdescription+xml" title="חיפוש בספר הטלפונים של ירוחם" href="opensearch.xml" />
    </Head>}
    {status === 401 ? <LoginPage/> : <AppComponent {...appProps} />}
  </div>
}
