import React, { ReactElement } from 'react'
import { ParsedUrlQuery } from 'querystring'
import { GetServerSideProps } from 'next'
import App from '../components/App'
import { AppProps } from '../types/AppProps'
import { getPage } from '../utils/data-layer'
import { requestProps } from '../utils/requestProps'

interface PageParams extends ParsedUrlQuery {
  title: string
}

export const getServerSideProps: GetServerSideProps<AppProps, PageParams> = async ({ query, params, req}) => {
  const { title } = params!
  if (title === 'new_page') {
    return {
      props: {
        status: 200,
        newPage: true,
        initialTitle: query.initialTitle as string || '',
        ...requestProps(req),
      }
    }
  }

  const result = await getPage(req, (title as string).replace(/\u201d/g, '"'))
  return {
    props: {
      status: result.status,
      page: await result.json(),
      ...requestProps(req),
    },
  }
}

export default function Title(appProps: AppProps): ReactElement {
  return <App {...appProps} />
}
