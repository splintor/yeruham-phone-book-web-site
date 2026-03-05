import { NextApiRequest, NextApiResponse } from 'next'
import { sendResponse } from '../../../utils/api'
import { getPageHistory } from '../../../utils/data-layer'

export default async function pageHistoryHandler(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const { query: { pageId } } = request
  return sendResponse(response, await getPageHistory(request, pageId as string))
}
