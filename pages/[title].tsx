import React from 'react'
import { ParsedUrlQuery } from 'querystring'
import { GetServerSideProps } from 'next'
import App from '../components/App'
import { AppProps } from '../types/AppProps'
import { getPage } from '../utils/firestore'
import { requestProps } from '../utils/requestProps'

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
