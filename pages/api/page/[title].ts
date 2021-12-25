import { NextApiRequest, NextApiResponse } from 'next'
import { sendResponse, sendUnsupportedMethodResponse } from '../../../utils/api'
import { getPage, savePage } from '../../../utils/data-layer'

export default async function page(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const { method, query: { title }} = request
  switch (method) {
    case 'GET':
      return sendResponse(response, await getPage(request, title as string))

   case 'POST':
     return sendResponse(response, await savePage(request))

    default:
      sendUnsupportedMethodResponse(response)
  }
}
