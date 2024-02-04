import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { ReactElement, ReactNode, useEffect, useState } from 'react'
import { AppProps } from '../types/AppProps'
import { publicTagName } from '../utils/consts'
import siteInfo from '../site-info.json'
import { AuthData, parseAuthCookies } from '../utils/cookies'
import { useHashAuth } from '../utils/url'
import { AppComponent } from './AppComponent'
import { ErrorBoundary } from './ErrorBoundary'
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
    ? `${page.title} - ${siteInfo.siteTitle}`
    : tag
      ? `${tag} - ${siteInfo.siteTitle}`
      : newPage
        ? `דף חדש - ${siteInfo.siteTitle}`
        : search
          ? `חיפוש: ${search} - ${siteInfo.siteTitle}`
          : siteInfo.siteTitle
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
          ? page.html.replace(/<[^>]+>|&nbsp;/g, ' ').replace(/מילת חיפוש.*/, '').replace(/מילות חיפוש.*/, '')
          : ''
        : siteInfo.siteDescription

  const [authData, setAuthData] = useState<AuthData>()
  useEffect(() => setAuthData(parseAuthCookies()), [])
  const hashAuth = useHashAuth()
  const isPageAllowed = status !== 401 && (authData?.auth || !newPage)

  useEffect(() => {
    if (siteInfo.titleBackgroundColor) {
      document.body.style.setProperty('--primary-color', siteInfo.titleBackgroundColor)
    }
    if (siteInfo.titleBackgroundHoverColor) {
      document.body.style.setProperty('--primary-color-hover', siteInfo.titleBackgroundHoverColor)
    }
    if (siteInfo.titleTextColor) {
      document.body.style.setProperty('--primary-text-color', siteInfo.titleTextColor)
    }
  }, [])

  // noinspection JSUnresolvedLibraryURL,HtmlUnknownTarget
  return <div className="app">
    <Head>
      <title>{pageTitle}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" key="viewport"/>
      <meta name="description" content={description} key="description"/>
      {showPreview && <>
        <meta property="og:title" content={decodeURI(pageTitle)} key="pageTitle"/>
        <meta property="og:description" content={description} key="previewDescription"/>
        <meta property="og:url" content={decodeURI(url)} key="url"/>
        <meta property="og:image" itemProp="image" content={`${origin}/logo-square.jpg`} key="image"/>
      </>}
      <link rel="icon" href="/favicon.ico"/>
      <link rel="apple-touch-icon" href="/logo192.png"/>
      <link rel="search" type="application/opensearchdescription+xml" title={`חיפוש ב${siteInfo.siteTitle}`} href="/opensearch.xml" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/css/bootstrap.rtl.min.css"
            integrity="sha384-jHiSqEim4+W1UCvv8kTcMbtCZlRF8MxbgKdfpvncia8gdN1UImBnhTpKtufREzv7" crossOrigin="anonymous"/>
    </Head>
    <ErrorBoundary>
      {authData ? (isPageAllowed && !hashAuth) ? <AppComponent authData={authData} {...appProps} /> : <LoginPage hashAuth={hashAuth}/> : ''}
    </ErrorBoundary>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-p34f1UUtsS3wqzfto5wAAmdvj+osOnFyQFpp4Ua3gs/ZVWx6oOypYoCJhGGScy+8" crossOrigin="anonymous"/>
  </div>
}
