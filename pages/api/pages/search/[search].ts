import { NextApiRequest, NextApiResponse } from 'next'
import { sendResponse } from '../../../../utils/api'
import { searchPages } from '../../../../utils/data-layer'

export default async function search(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const { query: { search } } = request
  return sendResponse(response, await searchPages(request, search as string))
}
