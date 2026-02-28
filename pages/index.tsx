import { GetServerSideProps } from 'next'
import React, { ReactElement } from 'react'
import App from '../components/App'
import { AppProps } from '../types/AppProps'
import { checkLogin } from '../utils/data-layer'
import { requestProps } from '../utils/requestProps'

// noinspection JSUnusedGlobalSymbols
export const getServerSideProps: GetServerSideProps<AppProps> = async ({ req, query}) => {
  const isGuestLogin = query.guestLogin !== undefined
  const { status } = isGuestLogin ? { status: 200 } : await checkLogin(req)

  return {
    props: {
      status,
      ...requestProps(req),
    },
  }
}

// noinspection JSUnusedGlobalSymbols
export default function Main(appProps: AppProps): ReactElement {
  return <App {...appProps} />
}
