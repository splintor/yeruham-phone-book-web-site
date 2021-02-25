import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { ReactElement, ReactNode, useEffect, useState } from 'react'
import { AppProps } from '../types/AppProps'
import { publicTagName, siteTitle } from '../utils/consts'
import { AuthData, parseAuthCookies } from '../utils/cookies'
import { AppComponent } from './AppComponent'
import { LoginPage } from './LoginPage'

export const deletedPageTitleKey = 'deleted-page-title'

export interface ToastOptions {
  content: ReactNode
  position?: 'top' | 'bottom'
  type?: 'success' | 'fail'
  timeout?: number
}

export function getPageTitle({ search, tag, page, newPage }: Partial<AppProps>): string {
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

export default function App(appProps: AppProps): ReactElement {
  const router = useRouter()
  const { url, origin, status, page, newPage } = appProps
  const pageTitle = getPageTitle(appProps)
  const showPreview = !router.query.noPreview
  const isPublicPage = page?.tags?.includes(publicTagName)
  const [authData, setAuthData] = useState<AuthData>()

  useEffect(() => setAuthData(parseAuthCookies()), [])
  const isPageAllowed = status !== 401 && (authData?.auth || !newPage)

  // suppress JSUnresolvedLibraryURL
  // noinspection JSUnresolvedLibraryURL
  return <html dir="rtl" lang="he"><div className="app">
    {showPreview && <Head>
      <title>{pageTitle}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <meta property="og:title" content={pageTitle} key="pageTitle"/>
      {isPublicPage && <meta property="og:description" content={page.html.replace(/<[^>]+>|&nbsp;/g, ' ')} key="pageHtml"/>}
      <meta property="og:url" content={url} key="url"/>
      <meta property="og:image" content={`${origin}/logo.png`} key="image"/>
      <link rel="icon" href="/favicon.ico"/>
      <link rel="search" type="application/opensearchdescription+xml" title="חיפוש בספר הטלפונים של ירוחם" href="opensearch.xml" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.rtl.min.css"
            integrity="sha384-4dNpRvNX0c/TdYEbYup8qbjvjaMrgUPh+g4I03CnNtANuv+VAvPL6LqdwzZKV38G" crossOrigin="anonymous"/>
    </Head>}
    {authData ? isPageAllowed ? <AppComponent authData={authData} {...appProps} /> : <LoginPage/> : ''}
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/js/bootstrap.bundle.min.js"
            integrity="sha384-b5kHyXgcpbZJO/tY9Ul7kGkf1S0CWuKcCD38l8YkeH8z8QjE0GmW1gYU5S9FOnJ0" crossOrigin="anonymous"/>
  </div></html>
}
