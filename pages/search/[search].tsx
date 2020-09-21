import React from 'react'
import { GetServerSideProps } from 'next'
import App from '../../components/App'
import { AppProps } from '../../types/AppProps'
import { searchPages } from '../../utils/data-layer'
import { requestProps } from '../../utils/requestProps'

export const getServerSideProps: GetServerSideProps<AppProps> = async ({ req, query}) => {
  const { search } = query as { search: string}
  const result = await searchPages(req, search as string)
  return {
    props: {
      search,
      status: result.status,
      pages: result.ok && (await result.json()).pages,
      ...requestProps(req)
    },
  }
}

export default function Home(appProps: AppProps) {
  return <App {...appProps} />
}
