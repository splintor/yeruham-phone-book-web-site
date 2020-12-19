import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import React, { ReactElement, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import TagManager from 'react-gtm-module'
import useDebounce from '../hooks/useDebounce'
import { AppProps, SearchResults } from '../types/AppProps'
import { PageData } from '../types/PageData'
import { adminEmail, siteTitle } from '../utils/consts'
import { isAuthTitleNew, parseAuthCookies } from '../utils/cookies'
import { savePage } from '../utils/api'
import { pageUrl } from '../utils/url'
import { AccountBadge } from './AccountBadge'
import { GitHubCorner } from './GitHubCorner'
import { LoginPage } from './LoginPage'
import { Modal } from './Modal'
import { TitleLink } from './TitleLink'

const PageEditor = dynamic(() => import('./PageEditor'))

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

interface PageContentProps extends Pick<AppProps, 'status' | 'page' | 'search' | 'tag' | 'newPage'> {
  pushState(url: string, state: Partial<AppProps>)
  setToast(toastOptions: ToastOptions)
}

function PageContent({ search, tag, pushState, setToast, ...props }: PageContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [page, setPage] = useState(props.page)
  const { html, title, tags } = page

  useEffect(() => {
    if (!isEditing && props.newPage) {
      setIsEditing(true)
    }
  }, [props.newPage])

  const saveChanges = async (pageToSave: PageData) => {
    await savePage(pageToSave)
    setPage(pageToSave)
    setIsEditing(false)
  }

  function cancelEditing(): void {
    if (props.newPage) {
      history.back()
    } else {
      setIsEditing(false)
    }
  }

  const deletePage = useCallback(async () => {
    await savePage({ ...page, isDeleted: true })
    const cancelDelete = (e: React.MouseEvent) => {
      e.preventDefault()
      setToast(undefined)
      savePage({ ...page, isDeleted: false }).then(() => {
        pushState(`/${page.title}`, { page })
        setToast({ content: <div>המחיקה של הדף<b>{page.title}</b> בוטלה.</div> })
      })
    }
    pushState('/', {})
    setToast({ content: <div>הדף<b>{page.title}</b> נמחק בהצלחה.<a className="cancel-button" href="/" onClick={cancelDelete}>בטל מחיקה</a></div> })
  }, [page])

  switch (props.status) {
    case 404:
      return <div className="results page">
        <div className="notFound">הדף <span className="searchedTitle">{title}</span> לא נמצא בספר הטלפונים.</div>
      </div>

    default:
      const backUrl = search ? `/search/${search}` : tag ? `/tag/${tag}` : null
      return isEditing ? <PageEditor page={page} onCancel={cancelEditing} onSave={saveChanges}/> :
        <div className="results page">
          <div className="buttons">
            <button className="delete" onClick={() => setShowDeleteConfirmation(true)}>מחיקה</button>
            <button onClick={() => setIsEditing(true)}>עריכה</button>
          </div>
          <Modal title={`מחיקת הדף ${title}`}
                 show={showDeleteConfirmation}
                 setShow={setShowDeleteConfirmation}
                 submitText="מחק את הדף"
                 onSubmit={deletePage}
          >
            האם ברצונך למחוק את הדף <b>{title}</b>?
          </Modal>
          <h1>
            {backUrl && <a className="backButton" href={backUrl} onClick={e => {
              e.preventDefault()
              history.back()
            }}>&#8658;</a>}
            <a href={pageUrl(title)}>{title}</a>
          </h1>
          <div dangerouslySetInnerHTML={{ __html: html }}/>
          <div className="tags">
            {tags && tags.map(t => <a className="titleLink tag" key={t} href={`/tag/${t}`}>{t}</a>)}
          </div>
        </div>
  }
}

interface ToastOptions {
  content: ReactNode;
  position?: 'top' | 'bottom'
  timeout?: number
}

function AppComponent(appProps: AppProps) {
  const [{ pages, tags, totalCount }, setSearchResults] = useState<SearchResults>({
    pages: appProps.pages,
    totalCount: appProps.totalCount,
    tags: appProps.tags
  })
  const [displayedPage, setDisplayedPage] = useState(appProps.newPage ? { title: '', html: '' } : appProps.page)
  const [search, setSearch] = useState(appProps.search || '')
  const [tag, setTag] = useState(appProps.tag)
  const [isSearching, setIsSearching] = useState(false)
  const [isNewPage, setIsNewPage] = useState(appProps.newPage)
  const [toast, setToast] = useState<ToastOptions>()
  const debouncedSearchTerm = useDebounce(search, 300)
  const stringBeingSearched = useRef(search)
  const lastSearch = useRef(search)
  const searchInput = useRef(null)
  const router = useRouter()
  const showWelcome = !search && !displayedPage && !pages

  function focusSearchInput(element = null) {
    if (element) {
      searchInput.current = element
    }

    if (searchInput.current) {
      searchInput.current.focus()
      if (search === appProps.search) {
        searchInput.current.selectionStart = search.length
      }
    }
  }

  useEffect(() => {
    if (isAuthTitleNew()) {
      const { authTitle } = parseAuthCookies()
      setToast({ position: 'top', timeout: 4000, content: <div>ברוך הבא לספר הטלפונים של ירוחם, <b>{authTitle}</b>!</div> })
    }
  })

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
      setTimeout(() => setToast(undefined), toast.timeout || 10000)
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

  const processDynamicState = useCallback((state: Partial<AppProps>) => {
    const { search, page, pages, tags, tag, totalCount } = state
    setSearch(search || '')
    setDisplayedPage(page || null)
    setIsSearching(false)
    setSearchResults({ pages, tags, totalCount })
    setTag(tag)
    setIsNewPage(state.newPage || false)
    const { authTitle } = parseAuthCookies()
    logToGTM({ event: 'navigation', authTitle, ...state })
    focusSearchInput()
  }, [setDisplayedPage, setSearchResults, setIsSearching, setSearchResults, setTag])

  function pushState(url: string, state: Partial<AppProps>) {
    window.history.pushState(state, '', url)
    document.title = getPageTitle(state)
    processDynamicState(state)
  }

  useEffect(() => {
    window.addEventListener('popstate', (e: PopStateEvent) => {
      processDynamicState(e.state as AppProps)
      return false
    })
  }, [processDynamicState])

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
      setIsSearching(!pages)
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

  useEffect(() => {
    Array.from(document.links).forEach(link => {
      if (link.href[0] !== '/' && !link.href.startsWith?.(location.origin) && !link.target) {
        link.target = '_blank'
      }
    })
  }, [displayedPage, pages, isSearching])

  return (
    <main className={showWelcome ? 'showWelcome' : ''}>
      <AccountBadge/>
      {toast && <div className={`toast ${toast.position}`}>
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
      <form className="searchForm" onSubmit={async e => {
        e.preventDefault()
        await performSearch()
      }}>
        <input type="text" value={search} ref={focusSearchInput} onChange={e => setSearch(e.target.value)}
               placeholder="חפש אדם, עסק או מוסד"/>
        <span className="searchIcon" style={{ display: 'none' }}>
            <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </span>
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
          ? <PageContent status={appProps.status} page={displayedPage} search={pages && search} tag={pages && tag}
                         newPage={isNewPage} pushState={pushState} setToast={setToast}/>
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
                  pages && pages.map(page => <div className="result" key={page.title}>
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
      <div className="logo"><img src="/logo.png" alt={siteTitle}/></div>
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

function getSearchResultTitle(pages: PageData[], tags: string[], totalCount) {
  const pagesCount = pages && pages.length || 0
  const tagsCount = tags && tags.length || 0

  switch (pagesCount) {
    case 0:
      switch (tagsCount) {
        case 0:
          return 'לא נמצאו תוצאות.'
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
        `${totalCount} דפים. מציג את ${pagesCount} הראשונים:` :
        `${pagesCount} דפים:`
      switch (tagsCount) {
        case 0:
          return `נמצאו ${suffix}`
        case 1:
          return `נמצאו קטגוריה אחת ו-${suffix}`
        default:
          return `נמצאו ${tagsCount} קטגוריות ן-${suffix}`
      }
  }
}

export default function App(appProps: AppProps): ReactElement {
  const { url, origin, status } = appProps
  const pageTitle = getPageTitle(appProps)

  useEffect(() => {
    const { authTitle } = parseAuthCookies()
    TagManager.initialize({ gtmId: 'GTM-TCN5G8S', dataLayer: { event: 'load', url, status, authTitle } })
  }, [])

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
