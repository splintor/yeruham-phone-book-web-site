import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { ReactElement, ReactNode, useEffect, useState } from 'react'
import { AppProps } from '../types/AppProps'
import { publicTagName, siteTitle } from '../utils/consts'
import { AuthData, parseAuthCookies } from '../utils/cookies'
import { useHashAuth } from '../utils/url'
import { AppComponent } from './AppComponent'
import { LoginPage } from './LoginPage'

export const deletedPageTitleKey = 'deleted-page-title'
export const editedPageCacheKey = (title: string): string => `edited-page-cache-${title}`

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
  const { url, origin, status, page, tag, search, newPage } = appProps
  const pageTitle = getPageTitle(appProps)
  const showPreview = !router.query.noPreview
  const description = search
    ? `תוצאות חיפוש עבור ${search}`
      : tag
      ? `רשימת הדפים בקטגוריה ${tag}`
      : page
        ? page?.tags?.includes(publicTagName)
          ? page.html.replace(/<[^>]+>|&nbsp;/g, ' ')
          : ''
        : 'כל הפרטים על מוסדות, עסקים ואנשים בירוחם. פרטי המוסדות והעסקים פתוחים לכולם. פרטי התושבים נגישים לתושבי ירוחם בלבד. תושבי ירוחם גם יכולים לערוך את הפרטים באתר ולדאוג שהוא ישאר מעודכן.'

  const [authData, setAuthData] = useState<AuthData>()
  useEffect(() => setAuthData(parseAuthCookies()), [])
  const hashAuth = useHashAuth()
  const isPageAllowed = status !== 401 && (authData?.auth || !newPage)


  // suppress JSUnresolvedLibraryURL
  // noinspection JSUnresolvedLibraryURL
  return <div className="app">
    <Head>
      <title>{pageTitle}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" key="viewport"/>
      <meta name="description" content={description} key="description"/>
      {showPreview && <>
        <meta property="og:title" content={pageTitle} key="pageTitle"/>
        <meta property="og:description" content={description} key="previewDescription"/>
        <meta property="og:url" content={url} key="url"/>
        <meta property="og:image" itemProp="image" content={`${origin}/logo-square.jpg`} key="image"/>
      </>}
      <link rel="icon" href="/favicon.ico"/>
      <link rel="search" type="application/opensearchdescription+xml" title="חיפוש בספר הטלפונים של ירוחם" href="opensearch.xml" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/css/bootstrap.rtl.min.css"
            integrity="sha384-jHiSqEim4+W1UCvv8kTcMbtCZlRF8MxbgKdfpvncia8gdN1UImBnhTpKtufREzv7" crossOrigin="anonymous"/>
    </Head>
    {authData ? (isPageAllowed && !hashAuth) ? <AppComponent authData={authData} {...appProps} /> : <LoginPage hashAuth={hashAuth}/> : ''}
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-p34f1UUtsS3wqzfto5wAAmdvj+osOnFyQFpp4Ua3gs/ZVWx6oOypYoCJhGGScy+8" crossOrigin="anonymous"/>
  </div>
}
