import { NextApiRequest, NextApiResponse } from 'next'
import { getPages } from '../../../../utils/firestore'

export default async function tag(request: NextApiRequest, response: NextApiResponse) {
  const { query: { tag } } = request
  const { status, data } = await getPages({ tag: tag as string }, request)
  response.status(status)
  data && response.json(data)
}
