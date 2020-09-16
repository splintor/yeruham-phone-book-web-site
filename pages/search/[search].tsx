import React from 'react';
import { GetServerSideProps } from 'next';
import App from '../../components/App';
import { AppProps } from '../../types/AppProps';
import { checkLogin, getPages } from '../../utils/firestore';
import { requestProps } from '../../utils/requestProps';

export const getServerSideProps: GetServerSideProps<AppProps> = async ({ req, query}) => {
  const { search } = query as { search: string}
  const { status, data } = await getPages({ search }, req)
  return {
    props: {
      search,
      status,
      pages: data?.pages,
      ...requestProps(req)
    },
  }
}

export default function Home(appProps: AppProps) {
  return <App {...appProps} />
}
