import absoluteUrl from 'next-absolute-url/index'
import Head from 'next/head'
import React from 'react'
import { ParsedUrlQuery } from 'querystring'
import { GetServerSideProps } from 'next'
import { AccountBadge } from '../components/AccountBadge'
import App from '../components/App';
import { LoginPage } from '../components/LoginPage'
import { siteTitle } from '../utils/consts'
import { PageData } from '../types/PageData'
import { AppProps } from '../types/AppProps'
import { getPage } from '../utils/firestore'
import { requestProps } from '../utils/requestProps';

interface PageParams extends ParsedUrlQuery {
  title: string
}

export const getServerSideProps: GetServerSideProps<AppProps, PageParams> = async ({ params: { title }, req}) => {
  const { status, data } = await getPage(title, req)
  return {
    props: {
      page: data || { title: '', html: '' },
      status,
      ...requestProps(req)
    },
  }
}

export default function Home(appProps: AppProps) {
  return <App {...appProps} />
}
