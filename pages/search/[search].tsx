import React, { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import App from '../../components/App'
import { AppProps } from '../../types/AppProps'
import { searchPages } from '../../utils/data-layer'
import { requestProps } from '../../utils/requestProps'

// noinspection JSUnusedGlobalSymbols
export const getServerSideProps: GetServerSideProps<AppProps> = async ({ req, query}) => {
  const search = (query.search as string).replace(/_/g, ' ')
  const result = await searchPages(req, search)
  return {
    props: {
      search,
      status: result.status,
      ...(result.ok && (await result.json())),
      ...requestProps(req)
    },
  }
}

// noinspection JSUnusedGlobalSymbols
export default function Search(appProps: AppProps): ReactElement {
  return <App {...appProps} />
}
