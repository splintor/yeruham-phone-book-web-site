import { GetServerSideProps } from 'next'
import absoluteUrl from 'next-absolute-url/index'
import React, { ReactElement } from 'react'
import App from '../components/App'
import { AppProps } from '../types/AppProps'
import { checkLogin } from '../utils/data-layer'

// noinspection JSUnusedGlobalSymbols
export const getServerSideProps: GetServerSideProps<AppProps> = async ({ req, query}) => {
  const isGuestLogin = query.guestLogin !== undefined
  const { status } = isGuestLogin ? { status: 200 } : await checkLogin(req)
  const { origin } = absoluteUrl(req)

  return {
    props: {
      origin,
      url: decodeURI(origin + req.url),
      status,
    },
  }
}

// noinspection JSUnusedGlobalSymbols
export default function Main(appProps: AppProps): ReactElement {
  return <App {...appProps} />
}
