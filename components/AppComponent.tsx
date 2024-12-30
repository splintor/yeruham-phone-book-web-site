import { useRouter } from 'next/router'
import React, { BaseSyntheticEvent, ReactElement, useEffect, useRef, useState } from 'react'
import useDebounce from '../hooks/useDebounce'
import { AppProps, SearchResults } from '../types/AppProps'
import siteInfo from '../site-info.json'
import { AuthData, isAuthTitleNew } from '../utils/cookies'
import { getSearchResultTitle } from '../utils/getSearchResultTitle'
import { searchForPages } from '../utils/requests.client'
import { initTagManager, logToGTM } from '../utils/tag-manager'
import { getSearchUrl, getTagUrl, pageUrl } from '../utils/url'
import type { PageData } from '../types/PageData'
import { deletedPageTitleKey, getPageTitle, ToastOptions } from './App'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { NavBar } from './NavBar'
import { PageContent } from './PageContent'
import { PageEditButtons } from './PageEditButtons'
import { PageHtmlRenderer } from './PageHtmlRenderer'
import { TagLink } from './TagLink'
import { TitleLink } from './TitleLink'
import { WelcomePage } from './WelcomePage'
import { CopyToClipboard } from './CopyToClipboard'

export function AppComponent(appProps: AppProps & { authData: AuthData }): ReactElement {
  if (location.hash === '#error1') {
    throw '#error1'
  }
  const [fromUserEdit, setFromUserEdit] = useState(false)
  const [searchFocusId, setSearchFocusId] = useState(0)
  const [pageStatus, setPageStatus] = useState(appProps.status)
  const [{ pages, tags, totalCount, search: searchFromResults }, setSearchResults] = useState<SearchResults>({
    pages: appProps.pages,
    totalCount: appProps.totalCount,
    tags: appProps.tags,
    search: appProps.search,
  })
  const [displayedPage, setDisplayedPage] = useState(appProps.newPage ? { page: { title: appProps.initialTitle || '', html: '' }, isEdited: true } : { page: appProps.page })
  const [search, setSearch] = useState(searchFromResults || '')
  const [tag, setTag] = useState(appProps.tag)
  const [isSearching, setIsSearching] = useState(false)
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false)
  const [toast, setToast] = useState<ToastOptions>()
  const debouncedSearchTerm = useDebounce(search, 300)
  const stringBeingSearched = useRef(search)
  const lastSearch = useRef(search)
  const router = useRouter()
  const isPageView = Boolean(displayedPage.page)
  const showWelcome = !isSearching && !isPageView && !pages
  const { authTitle } = appProps.authData
  const isGuestLogin = !authTitle
  if (location.hash === '#error2') {
    throw '#error2'
  }

  useEffect(() => {
    if (location.hash === '#error3') {
      throw '#error3'
    }

    window.history.replaceState(appProps, '', location.href)
    initTagManager(appProps.url, authTitle)
    if (isAuthTitleNew()) {
      setToast({ position: 'top', timeout: 5000, content: <div>הי <b>{authTitle}</b>, איזה כיף שהתחברת ל{siteInfo.siteTitle}!</div> })
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
    if (!isPageView && pages?.length > 0) {
      document.querySelectorAll?.('.preview, .preview > table > tbody > tr > td > div').forEach((p: HTMLElement) => {
        for (let i = p.children.length - 1; i >= 0; --i) {
          const c = p.children[i] as HTMLElement
          if (!c.innerText?.trim() && !c.querySelector('img')) {
            c.remove()
          }
        }

        setTimeout(() => {
          if (p.scrollHeight > p.offsetHeight) {
            p.classList.add('truncated')
            if (p.scrollHeight - p.offsetHeight < 50) {
              p.classList.add('smallTruncate')
            } else {
              p.classList.remove('smallTruncate')
            }
          } else {
            p.classList.remove('truncated')
          }
        }, 0)
      })
    }
  }, [pages, isPageView])

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
    setPageStatus(200)
    setDisplayedPage({ page: page || null, isEdited: state.newPage || false })
    setIsSearching(false)
    setSearchResults({ pages, tags, totalCount, search })
    setTag(tag)
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

  function onUpdatePageTitle(page: PageData) {
    const props: AppProps = { ...appProps, page }
    window.history.replaceState(props, '', pageUrl(page.title))
    document.title = getPageTitle(props)
    processDynamicState(props)
  }

  useEffect(() => {
    window.addEventListener('popstate', (e: PopStateEvent) => {
      if (e.state) {
        processDynamicState(e.state as AppProps)
      }
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

  async function performSearch(e: BaseSyntheticEvent) {
    e.preventDefault()
    if (!search) {
      return
    }

    setDisplayedPage({ page: null })
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
  }, [displayedPage.page, pages, isSearching])

  function markUserEdit(userSearch: string) {
    setFromUserEdit(true)
    setSearch(userSearch)
  }

  const closePage = pages && isPageView && (() => {
    setDisplayedPage({ page: null })
    pushState(tag ? getTagUrl(tag) : getSearchUrl(search), { pages, totalCount, tags, tag, search })
  })

  // noinspection HtmlUnknownTarget
  return (<>
    <NavBar authTitle={authTitle} showWelcome={showWelcome}
            page={displayedPage.page} search={search} tag={tag} setToast={setToast} goToHome={goToHome} performSearch={performSearch}
            markUserEdit={markUserEdit} searchFocusId={searchFocusId}/>
    {toast && <div className={`alert ${toast.type === 'fail' ? 'alert-danger' : 'alert-success'} ${toast.position === 'bottom' ? 'position-fixed bottom-0 w-100 mb-0' : ''}`}>
      <div className="d-flex">
        <div className="toast-body">
          {toast.content}
        </div>
        <button type="button" className="btn-close me-2 m-auto" onClick={() => setToast(null)}/>
      </div>
    </div>}

    <main className={'container mw-100' + (showWelcome ? ' showWelcome' : '')}>
      {showWelcome
        ? <WelcomePage authTitle={authTitle} search={search} performSearch={performSearch} markUserEdit={markUserEdit} searchFocusId={searchFocusId}/>
        : isPageView
          ? <PageContent status={pageStatus} {...displayedPage} pages={pages} search={search} tag={tag} totalCount={totalCount} closePage={closePage}
                         pushState={pushState} setToast={setToast} onUpdatePageTitle={onUpdatePageTitle} isGuestLogin={isGuestLogin}
                         isDeleteConfirmationVisible={isDeleteConfirmationVisible}/>
          : <div className="p-2">
            {isSearching
              ? <div className="d-flex justify-content-center text-primary mt-4"><div>
                    <span className="spinner-border spinner-border-sm me-1" role="status"/>
                      מחפש...
                </div></div>
              : <>
                {tag && <h3><TagLink tag={tag} pushState={pushState} kind="title"/></h3>}
                <h5>
                  {getSearchResultTitle(pages, tags, totalCount, search, tag, !authTitle)}
                  <CopyToClipboard page={displayedPage.page} search={search} tag={tag} setToast={setToast} />
                </h5>
                {
                  tags && tags.map(t => <span className="fs-4" key={t}>
                    <TagLink key={t} tag={t} pushState={pushState} kind="title"/>
                  </span>)
                }
                {
                  pages?.map((page) => <div className="result card p-1 mb-3" key={page.title}>
                    <div className="card-body p-2">
                      <PageEditButtons page={page}
                                       isGuestLogin={isGuestLogin}
                                       startEditing={() => setDisplayedPage({ page, isEdited: true })}/>
                      <h5 className="card-title">
                        <TitleLink title={page.title} key={page.title} onClick={e => {
                          e.preventDefault()
                          pushState(pageUrl(page.title), { pages, totalCount, tags, tag, search })
                          setPageStatus(200)
                          setDisplayedPage({ page })
                        }}/>
                        <CopyToClipboard page={page} tag="" search="" setToast={setToast} />
                      </h5>
                      <div>
                        {page.tags?.map(tag => <TagLink key={tag} tag={tag} pushState={pushState} kind="small"/>)}
                      </div>
                      <input type="checkbox" id={page.title} defaultChecked={pages.length === 1}/>
                      <PageHtmlRenderer pushState={pushState} className="preview" page={page} pages={pages} totalCount={totalCount} search={search} tags={tags} tag={tag}/>
                      <label htmlFor={page.title} role="button">הצג עוד...</label>
                    </div>
                  </div>)
                }
              </>
            }
          </div>
      }
    </main>
    <DeleteConfirmationModal setModalVisible={setIsDeleteConfirmationVisible}
                             pushState={pushState}
                             setToast={setToast}
                             setSearchResults={setSearchResults}
                             isPageView={isPageView}
                             pages={pages}
                             search={search}
                             tag={tag}
                             tags={tags}/>
  </>)
}
