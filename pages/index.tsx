import { GetServerSideProps } from 'next';
import absoluteUrl from 'next-absolute-url/index';
import React from 'react';
import Head from 'next/head'
import { siteTitle } from '../consts'

export const getServerSideProps: GetServerSideProps = async ({ req}) => {
  const { origin } = absoluteUrl(req)
  return {
    props: {
      origin,
      url: decodeURI(origin + req.url),
    },
  }
}

export default function Home( { url, origin }) {
  return (
    <div className="home">
      <Head>
        <title>{siteTitle}</title>
        <meta property="og:title" content={siteTitle} key="title"/>
        <meta property="og:url" content={url} key="url"/>
        <meta property="og:image" content={`${origin}/logo.png`} key="image"/>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">{siteTitle}</h1>
      </main>
    </div>
  )
}
