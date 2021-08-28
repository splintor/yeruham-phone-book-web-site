import { NextApiRequest, NextApiResponse } from 'next'
import { getRequestLogData, sendResponse } from '../../../../utils/api'
import { getTagPages } from '../../../../utils/data-layer'

// noinspection JSUnusedGlobalSymbols
export default async function(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const { query: { tag } } = request
  return sendResponse(response, await getTagPages(request, tag as string))
}
