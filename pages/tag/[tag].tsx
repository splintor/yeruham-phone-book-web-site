import React, { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import App from '../../components/App'
import { AppProps } from '../../types/AppProps'
import { getTagPages } from '../../utils/data-layer'
import { requestProps } from '../../utils/requestProps'

// noinspection JSUnusedGlobalSymbols
export const getServerSideProps: GetServerSideProps<AppProps> = async ({ req, query}) => {
  const tag = (query.tag as string).replace(/_/g, ' ')
  const result = await getTagPages(req, tag)
  return {
    props: {
      tag,
      status: result.status,
      ...(result.ok && (await result.json())),
      ...requestProps(req)
    },
  }
}

// noinspection JSUnusedGlobalSymbols
export default function Tag(appProps: AppProps): ReactElement {
  return <App {...appProps} />
}
