import { GetServerSideProps } from 'next'
import absoluteUrl from 'next-absolute-url/index'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { parse } from 'cookie'
import Head from 'next/head'
import fetch from 'isomorphic-fetch'
import { AccountBadge } from '../components/AccountBadge';
import { LoginPage } from '../components/LoginPage'
import { adminEmail, functionsUrl, siteTitle } from '../consts'
import { PageData } from '../types/PageData';
import { PageProps } from '../types/PageProps';

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ req, query}) => {
  const { origin } = absoluteUrl(req)
  const { auth } = parse(req.headers.cookie || '')
  const status = auth ? 200 : 401
  return {
    props: {
      origin,
      status,
      pages,
      url: decodeURI(origin + req.url),
    },
  }
}

function HomeComponent({ pages }: Pick<PageProps, 'pages'>) {
  const { search: initialSearch } = useRouter().query
  const [search, setSearch] = useState(initialSearch)

  return (
      <main>
        <h1 className="title">{siteTitle}</h1>
        <form className="searchForm">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="חפש אדם, עסק או מוסד"/>
          <span className="searchIcon">
            <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </span>
        </form>

        <AccountBadge/>
        <div>
        האתר זמין גם כ<a href="https://play.google.com/store/apps/details?id=com.splintor.yeruhamphonebook">אפליקצית אנדרואיד</a> וכ<a href="https://groups.google.com/d/msg/yerucham1/QWQYnxeXNfU/Q104gimvAAAJ">בוט בטלגרם</a>
        </div>
        <div>
        הסבר על השימוש באתר אפשר למצוא כאן
        </div>
        <div>
        הערות והצעות <a href={`mailto:${adminEmail}?subject=ספר הטלפונים של ירוחם`}>כדאי לשלוח במייל</a>
        </div>
        <div className="logo"><img src="/logo.png" alt={siteTitle} /></div>
      </main>
  )
}

export default function Home({ url, origin, status, pages }: PageProps) {
  return <div className="home">
    <Head>
      <title>{siteTitle}</title>
      <meta property="og:title" content={siteTitle} key="title"/>
      <meta property="og:url" content={url} key="url"/>
      <meta property="og:image" content={`${origin}/logo.png`} key="image"/>
      <link rel="icon" href="/favicon.ico"/>
    </Head>
    {status === 401 ? <LoginPage/> : <HomeComponent pages={pages}/>}
  </div>
}
