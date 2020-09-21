import { NextApiRequest, NextApiResponse } from 'next'
import { getRequestLogData, sendResponse } from '../../../../utils/api'
import { searchPages } from '../../../../utils/data-layer'

export default async function search(request: NextApiRequest, response: NextApiResponse) {
  const { query: { search } } = request
  return sendResponse(response, await searchPages(request, search as string), getRequestLogData(request))
}
