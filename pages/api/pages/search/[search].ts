import { NextApiRequest, NextApiResponse } from 'next'
import { getPages } from '../../../../utils/firestore'

export default async function search(request: NextApiRequest, response: NextApiResponse) {
  const { query: { search } } = request
  const { status, data } = await getPages({ search: search as string }, request)
  response.status(status)
  data && response.json(data)
}
