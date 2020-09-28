import React from 'react'
import { GetServerSideProps } from 'next'
import App from '../../components/App'
import { AppProps } from '../../types/AppProps'
import { getTagPages } from '../../utils/data-layer'
import { requestProps } from '../../utils/requestProps'

export const getServerSideProps: GetServerSideProps<AppProps> = async ({ req, query}) => {
  const { tag } = query as { tag: string}
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

export default function(appProps: AppProps) {
  return <App {...appProps} />
}
