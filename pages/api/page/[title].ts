import { NextApiRequest, NextApiResponse } from 'next'
import { getRequestLogData, sendResponse, sendUnsupportedMethodResponse } from '../../../utils/api'
import { getPage, savePage } from '../../../utils/data-layer'

export default async function page(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const { method, query: { title }} = request
  switch (request.method) {
    case 'GET':
      return sendResponse(response, await getPage(request, title as string), getRequestLogData(request))

   case 'POST':
     return sendResponse(response, await savePage(request), getRequestLogData(request))

    default:
      sendUnsupportedMethodResponse(response, `Unexpected method ${method} for page API`, getRequestLogData(request))
  }
}
