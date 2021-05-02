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
  return <div className="app">
    {showPreview && <Head>
      <title>{pageTitle}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <meta property="og:title" content={pageTitle} key="pageTitle"/>
      {isPublicPage && <meta property="og:description" content={page.html.replace(/<[^>]+>|&nbsp;/g, ' ')} key="pageHtml"/>}
      <meta property="og:url" content={url} key="url"/>
      <meta property="og:image" content={`${origin}/logo.png`} key="image"/>
      <link rel="icon" href="/favicon.ico"/>
      <link rel="search" type="application/opensearchdescription+xml" title="חיפוש בספר הטלפונים של ירוחם" href="opensearch.xml" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/css/bootstrap.rtl.min.css"
            integrity="sha384-trxYGD5BY4TyBTvU5H23FalSCYwpLA0vWEvXXGm5eytyztxb+97WzzY+IWDOSbav" crossOrigin="anonymous"/>
    </Head>}
    {authData ? isPageAllowed ? <AppComponent authData={authData} {...appProps} /> : <LoginPage/> : ''}
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.bundle.min.js" integrity="sha384-JEW9xMcG8R+pH31jmWH6WWP0WintQrMb4s7ZOdauHnUtxwoG2vI5DkLtS3qm9Ekf" crossOrigin="anonymous"/>
    </div>
}
