import { NextApiRequest, NextApiResponse } from 'next'
import { getRequestLogData, sendResponse } from '../../utils/api'
import { savePage } from '../../utils/data-layer'

export default async function save(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  return sendResponse(response, await savePage(request), getRequestLogData(request))
}
