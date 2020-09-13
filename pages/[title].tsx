import absoluteUrl from 'next-absolute-url/index'
import Head from 'next/head'
import React from 'react'
import { ParsedUrlQuery } from 'querystring'
import { GetServerSideProps } from 'next'
import { parse } from 'cookie'
import { AccountBadge } from '../components/AccountBadge';
import { LoginPage } from '../components/LoginPage';
import { siteTitle } from '../utils/consts'
import { PageData } from '../types/PageData';
import { PageProps } from '../types/PageProps';
import { getPage } from '../utils/firestore';

interface PageParams extends ParsedUrlQuery {
  title: string
}

export const getServerSideProps: GetServerSideProps<PageProps, PageParams> = async ({ params: { title }, req}) => {
  const pageResponse = await getPage(title, req)
  const { origin } = absoluteUrl(req)
  return {
    props: {
      pages: pageResponse.fail() ? [{ title, html: '' }] : [pageResponse.data],
      status: pageResponse.status,
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
        <AccountBadge/>
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
