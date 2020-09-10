import absoluteUrl from 'next-absolute-url/index'
import Head from 'next/head'
import React from 'react'
import { ParsedUrlQuery } from 'querystring'
import { GetServerSideProps } from 'next'
import fetch from 'isomorphic-fetch'
import { parse } from 'cookie'
import { LoginPage } from '../../components/LoginPage';
import { functionsUrl, siteTitle } from '../../consts'
import { PageData } from '../../types/PageData';
import { PageProps } from '../../types/PageProps';

interface PageParams extends ParsedUrlQuery {
  title: string
}

export const getServerSideProps: GetServerSideProps<PageProps, PageParams> = async ({ params, req}) => {
  const { origin } = absoluteUrl(req)
  const { auth, authTitle } = parse(req.headers.cookie || '')
  const title = params.title.replace(/_/g, ' ')
  const res = auth
    ? await fetch(`${functionsUrl}/page/${encodeURI(title)}`, { headers: { Authorization: auth } })
    : { status: 401 }
  return {
    props: {
      pages: res.ok ? [await res.json()] : [{ title }],
      status: res.status,
      origin,
      url: decodeURI(origin + req.url),
    },
  }
}

function renderContent({ status, html, title }: Pick<PageProps, 'status'> & PageData) {
  switch(status) {
    case 404:
      return <h3 className="notFound">הדף <span className="title">{title}</span> לא נמצא בספר הטלפונים</h3>

    case 401:
      return <LoginPage/>

    default:
      return <div>
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: html }}/>
      </div>
  }
}

export default function Page({ pages, status, origin, url }: PageProps) {
  const [{ title, html }] = pages
  const pageTitle = `${title} - ${siteTitle}`
  return <div className="page">
    <Head>
      <title>{pageTitle}</title>
      <meta property="og:title" content={pageTitle} key="title"/>
      <meta property="og:url" content={url} key="url"/>
      <meta property="og:image" content={`${origin}/logo.png`} key="image"/>
      <link rel="icon" href="/favicon.ico" />
    </Head>
    {renderContent({ status, title, html })}
  </div>
}
