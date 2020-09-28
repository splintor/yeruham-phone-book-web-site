import { GetServerSideProps } from 'next'
import absoluteUrl from 'next-absolute-url/index'
import React from 'react'
import App from '../components/App'
import { AppProps } from '../types/AppProps'
import { checkLogin } from '../utils/data-layer'

export const getServerSideProps: GetServerSideProps<AppProps> = async ({ req}) => {
  const { status } = await checkLogin(req)
  const { origin } = absoluteUrl(req)

  return {
    props: {
      origin,
      url: decodeURI(origin + req.url),
      status,
    },
  }
}

export default function(appProps: AppProps) {
  return <App {...appProps} />
}
