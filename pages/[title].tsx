import React from 'react'
import { ParsedUrlQuery } from 'querystring'
import { GetServerSideProps } from 'next'
import App from '../components/App'
import { AppProps } from '../types/AppProps'
import { getPage } from '../utils/data-layer'
import { requestProps } from '../utils/requestProps'

interface PageParams extends ParsedUrlQuery {
  title: string
}

export const getServerSideProps: GetServerSideProps<AppProps, PageParams> = async ({ params: { title }, req}) => {
  const result = await getPage(req, title as string)
  return {
    props: {
      status: result.status,
      page: await result.json(),
      ...requestProps(req)
    },
  }
}

export default function(appProps: AppProps) {
  return <App {...appProps} />
}
