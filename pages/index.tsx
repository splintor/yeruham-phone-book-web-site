import { GetServerSideProps } from 'next'
import absoluteUrl from 'next-absolute-url/index'
import React from 'react'
import App from '../components/App';
import { AppProps } from '../types/AppProps'
import { checkLogin } from '../utils/firestore'

export const getServerSideProps: GetServerSideProps<AppProps> = async ({ req}) => {
  const { origin } = absoluteUrl(req)

  return {
    props: {
      origin,
      url: decodeURI(origin + req.url),
      status: checkLogin(req).status,
    },
  }
}

export default function Home(appProps: AppProps) {
  return <App {...appProps} />
}
