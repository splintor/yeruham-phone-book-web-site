import { NextApiRequest, NextApiResponse } from 'next'
import { getRequestLogData, sendResponse } from '../../../../utils/api'
import { getTagPages } from '../../../../utils/data-layer'

export default async function tag(request: NextApiRequest, response: NextApiResponse) {
  const { query: { tag } } = request
  return sendResponse(response, await getTagPages(request, tag as string), getRequestLogData(request))
}
